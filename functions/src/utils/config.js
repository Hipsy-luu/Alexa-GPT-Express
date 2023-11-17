const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    enviroment: process.env.ENVIRONMENT,
    gptOrganization: process.env.GPT_ORGANIZATION,
    gptApiKey: process.env.GPT_API_KEY,
};