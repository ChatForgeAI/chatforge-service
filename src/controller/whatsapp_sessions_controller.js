const { createSession } = require('../services/whats_app_service/whatsapp_client.js');
const AppDataSource = require('../config/data-source');
const ChannelSession = require('../entities/channel_session.entity');
const errorResponse = require('../utils/response_handel/error_handeler.js');
const successResponse = require('../utils/response_handel/success_handeler.js');
const fs = require('fs').promises;
const { clientsList } = require('../services/whats_app_service/whatsapp_client.js');
const path = require('path');

const sessionRepo = () => AppDataSource.getRepository(ChannelSession);

exports.startWhatsAppSession = async (req, res) => {
  const userId = req.headers['x-user-id'];
  const sessionName = req.body.name.replaceAll(' ', '_');

  try {
    const checkUsedSessionName = await sessionRepo().findOne({ where: { name: sessionName } });
    if (checkUsedSessionName) {
      return errorResponse(res, 'Session name already used', 400, 'Session name already used');
    }

    const sessionSecret = 'whatsapp.session.' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const sessionData = {
      name: sessionName,
      userId: userId,
      sessionSecret,
    };

    const entity = sessionRepo().create(sessionData);
    const whatsAppSession = await sessionRepo().save(entity);
    sessionData.id = whatsAppSession.id;

    createSession({ ...whatsAppSession, ...sessionData }).then(() => {
      console.log('Session created successfully');
    });

    return successResponse(res, whatsAppSession, 200, 'Start WhatsApp session successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to start WhatsApp session');
  }
};

exports.terminateWhatsAppSession = async (req, res) => {
  try {
    const { session_id } = req.body;

    const session = await sessionRepo().findOne({ where: { id: session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    const clientObjIndex = clientsList.findIndex(user => user.session_id.toString() === session.id.toString());
    if (clientObjIndex !== -1 && clientsList[clientObjIndex].client) {
      try {
        await clientsList[clientObjIndex].client.destroy();
        console.log(`Client destroyed for session: ${session.name}`);
      } catch (destroyErr) {
        console.warn(`Client destroy failed for session ${session.name}: ${destroyErr.message}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const sessionPath = path.join(__dirname, '..', 'storage', 'session', session.name);

    try {
      await fs.rm(sessionPath, { recursive: true, force: true });
      console.log(`Session folder deleted: ${sessionPath}`);
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.warn(`Could not delete session folder due to lock: ${err.message}`);
      } else {
        throw err;
      }
    }

    if (clientObjIndex !== -1) {
      clientsList.splice(clientObjIndex, 1);
    }

    await sessionRepo().delete(session_id);

    return successResponse(res, null, 200, 'Session terminated successfully');
  } catch (e) {
    console.error(`Failed to terminate session: ${e.message}`);
    return errorResponse(res, e.message, 500, 'Failed to terminate session');
  }
};

exports.getLastWhatsAppQrCode = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return errorResponse(res, 'session_id is required', 400, 'session_id is required');
    }

    const session = await sessionRepo().findOne({ where: { id: session_id } });
    if (!session) {
      return successResponse(res, null, 404, 'Session not found');
    }

    return successResponse(res, {
      session_id: session.id,
      name: session.name,
      qr_code: session.whatsappQrCode,
      status: session.whatsappSessionStatus,
    }, 200, 'QR code retrieved successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to get QR code');
  }
};

exports.restartWhatsAppSession = async (req, res) => {
  try {
    await req.body.whatsAppSession.client.destroy();

    await req.body.whatsAppSession.client.initialize().then(() => {
      console.log(`Client ${req.headers['session_id']} restarted successfully`);
    });

    return successResponse(res, null, 200, 'Session restarted successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to restart session');
  }
};

exports.updateSessionName = async (req, res) => {
  try {
    if (!/^[a-zA-Z\s]+$/.test(req.body.name)) {
      return errorResponse(res, 'Session name must be alphabet only', 400, 'Session name must be alphabet only');
    }

    const checkUsedSessionName = await sessionRepo().findOne({ where: { name: req.body.name } });
    if (checkUsedSessionName) {
      return errorResponse(res, 'Session name already used', 400, 'Session name already used');
    }

    const session = await sessionRepo().findOne({ where: { id: req.body.session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    session.name = req.body.name.replaceAll(' ', '_');
    await sessionRepo().save(session);

    return successResponse(res, session, 200, 'Session name updated successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to update session name');
  }
};
