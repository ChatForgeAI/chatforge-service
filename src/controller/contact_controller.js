const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");
const Contact = require("../models/contact_model.js");
const {clientsList} = require("../services/whats_app_service/whatsapp_client.js");
const WhatsAppSession = require("../models/whatsaapp_session_model.js");

// @desc get all contacts for user
// @route get /chat/get-contact
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({ userId: req.headers['x-user-id'] });

        return successResponse(res, contacts, 200, "Contacts found successfully")
    } catch (e) {
        return errorResponse(res, e.message, 500, "Contacts not found")
    }
}

// @desc get contact by phone number
// @route get /chat/get-contact-by-phone
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number" : "972598045064"}
exports.getContact = async (req, res) => {
    try {
        const contact = await Contact.findOne({ userId: req.headers['x-user-id'], phoneNumber: req.body.phone_number });

        return successResponse(res, contact, 200, "Contact found successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Contact not found")
    }
}

// @desc get contact profile picture
// @route get /chat/get-account-pic
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number" : "972598045064"}
exports.getContactProfilePic = async (req, res) => {
    try {
        const contact = await req.body.whatsAppSession.client.getContactById(req.body['phone_number'] + '@c.us');
        const profilePicUrl = await contact.getProfilePicUrl();
        if (!profilePicUrl) {
            return errorResponse(res, null, 404, "Profile picture not found")
        }
        return successResponse(res, profilePicUrl, 200, "Profile picture found successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Profile picture not found")
    }
}

// @desc validate if number using whats-app
// @route post /chat/validate-number-user-whats-app
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number" : "972598045064"}
exports.validateNumber = async (req, res) => {
    try {
        const contact = await req.body.whatsAppSession.client.isRegisteredUser(req.params.phone + '@c.us');

        if (!contact) {
            return errorResponse(res, null, 404, `${req.params.phone} is not a whatsapp user`)
        }
        return successResponse(res, null, 200, `${req.params.phone} is a whatsapp user`)

    } catch (e) {
        return errorResponse(res, e.message, 500, "Number not validated")
    }
}

// @desc save all previous contact
// @route post /chat/save-previous-contact
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.savePreviousContact = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const whatsAppSessions = await WhatsAppSession.find({ userId });

        let allContacts = [];

        for (const session of whatsAppSessions) {
            const clientObj = clientsList.find(c => c.session_id.toString() === session._id.toString());

            if (!clientObj || !clientObj.client) {
                console.warn(`No active client found for session ${session.name}`);
                continue;
            }

            const contacts = await clientObj.client.getContacts();

            for (const contact of contacts) {
                if (contact.isGroup === false && contact.number) {
                    allContacts.push({
                        userId,
                        phoneNumber: contact.number,
                        name: contact.pushname || contact.name || contact.shortName || null,
                    });
                }
            }
        }

        // Remove duplicates by phoneNumber
        const uniqueContactsMap = new Map();
        for (const contact of allContacts) {
            if (!uniqueContactsMap.has(contact.phoneNumber)) {
                uniqueContactsMap.set(contact.phoneNumber, contact);
            }
        }

        const uniqueContacts = Array.from(uniqueContactsMap.values());

        if (uniqueContacts.length > 0) {
            await Contact.insertMany(uniqueContacts);
            console.log(`Inserted ${uniqueContacts.length} unique contacts (non-group)`);
        }

        return successResponse(res, null, 200, "Contacts saved successfully");
    } catch (e) {
        console.error(`Error saving contacts: ${e.message}`);
        return errorResponse(res, e.message, 500, "Contacts not saved");
    }
};

// @desc save new contact
// @route post /chat/save-new-contact
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number" : "972598045064", "name" : "John Doe"}
exports.saveNewContact = async (req, res) => {
    try {
        const contact = {
            userId: req.headers['x-user-id'], phoneNumber: req.body['phone_number'], name: req.body.name,
        }

        const contactExist = await Contact.findOne({
            userId: req.headers['x-user-id'], phoneNumber: req.body['phone_number']
        });

        if (contactExist) {
            return errorResponse(res, null, 404, "Contact already exist")
        }

        const contactSaved = await Contact.create(contact);

        return successResponse(res, contactSaved, 200, "Contact saved successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Contact not saved")
    }
}