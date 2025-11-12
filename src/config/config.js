require('dotenv').config()

module.exports = {
	development: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		dialect: "sqlite3",
		logging: false,
		port: 3306,
	},
	production: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		dialect: "sqlite3",
		logging: false,
		port: 3306,
	}
}