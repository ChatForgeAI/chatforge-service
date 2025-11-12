const AuthRoutes = require('./auth_rouet');
const ChatRoutes = require('./chat_rouet');
const ContactRoutes = require('./contact_rouet');
const AccountRoutes = require('./account_rouet');
const GroupRoutes = require('./group_rouet');
const PlanRoutes = require('./plan_rouet');
const TemplateMessage = require('./template_message_rouet');
const AutoReplyRoutes = require('./auto_replay_rouet');
const UserRoutes = require('./user_route')
const SessionRoutes = require('./sessions_rouet');
const CommonQuestionRouet = require('./common_question_rouet');

const loggerRequest = require('../middlewere/log_request_send');

module.exports = (app) => {
    app.use(loggerRequest);

    app.use('/auth', AuthRoutes);
    app.use('/chat', ChatRoutes);
    app.use('/contact', ContactRoutes);
    app.use('/account', AccountRoutes);
    app.use('/group', GroupRoutes);
    app.use('/plan', PlanRoutes);
    app.use('/template-message', TemplateMessage);
    app.use('/auto-reply', AutoReplyRoutes);
    app.use('/user', UserRoutes);
    app.use('/session', SessionRoutes);
    app.use('/question', CommonQuestionRouet);
}