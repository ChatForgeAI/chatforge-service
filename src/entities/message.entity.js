const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Message',
  tableName: 'messages',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    sessionId: {
      type: 'varchar',
      nullable: false,
    },
    platform: {
      type: 'varchar',
      nullable: false,
    },
    chatId: {
      type: 'varchar',
      nullable: false,
    },
    senderId: {
      type: 'varchar',
      nullable: false,
    },
    senderName: {
      type: 'varchar',
      nullable: false,
      default: '',
    },
    message: {
      type: 'text',
      nullable: false,
      default: '',
    },
    messageType: {
      type: 'varchar',
      nullable: false,
      default: 'text',
    },
    direction: {
      type: 'varchar',
      nullable: false,
    },
    fileId: {
      type: 'varchar',
      nullable: true,
      default: null,
    },
    createdAt: {
      type: 'timestamp',
      nullable: false,
      default: () => 'NOW()',
    },
  },
  indices: [
    {
      name: 'IDX_MESSAGE_SESSION_CHAT_DATE',
      columns: ['sessionId', 'chatId', 'createdAt'],
    },
  ],
});
