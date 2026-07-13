require('reflect-metadata');
const { DataSource } = require('typeorm');
const ChannelSession = require('../entities/channel_session.entity');
const Message = require('../entities/message.entity');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  username: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DATABASE || 'chatforge',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [ChannelSession, Message],
});

module.exports = AppDataSource;
