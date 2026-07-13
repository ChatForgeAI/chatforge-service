const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ChannelSession',
  tableName: 'channel_sessions',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    userId: {
      type: 'varchar',
      nullable: false,
    },
    name: {
      type: 'varchar',
      nullable: false,
    },
    sessionSecret: {
      type: 'varchar',
      nullable: false,
    },
    whatsappQrCode: {
      type: 'text',
      nullable: true,
      default: null,
    },
    whatsappSessionStatus: {
      type: 'varchar',
      nullable: false,
      default: 'initialize',
    },
    telegramBotToken: {
      type: 'varchar',
      nullable: true,
      default: null,
    },
    telegramBotMode: {
      type: 'varchar',
      nullable: false,
      default: 'polling',
    },
    telegramBotStatus: {
      type: 'varchar',
      nullable: false,
      default: 'initialize',
    },
    createdAt: {
      type: 'timestamp',
      nullable: false,
      default: () => 'NOW()',
    },
  },
  indices: [
    {
      name: 'IDX_CHANNEL_NAME',
      columns: ['name'],
      unique: true,
    },
    {
      name: 'IDX_CHANNEL_USER',
      columns: ['userId'],
    },
  ],
});
