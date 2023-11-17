const express = require("express");
const { SkillRequestSignatureVerifier, TimestampVerifier }  = require("ask-sdk-express-adapter");
const  bodyParser  = require("body-parser");
const  { SkillBuilders }  = require("ask-sdk-core");

// Create Server
const app = express();

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var PORT = process.env.port || 3001;

//Se importan los manejadores de las peticiones
const { RequestHandler , getHistoryList } = require('./handlers/gptHandlers');
const { ErrorHandler } = require('./handlers/errorHandlers');

//Se instancia la skill de la 
let skill = SkillBuilders.custom()
    .addRequestHandlers( RequestHandler )
    .addErrorHandlers( ErrorHandler)
    .create();
let actualError = null;

// Ruta para la funcionalidad de alexa
app.post('/', async (request, response, next) => {
    try {
        //Se verifica que la petición venga de amazon alexa (CPANEL no funciona)
        let textBody = JSON.stringify(request.body);
        
        await new SkillRequestSignatureVerifier().verify( textBody , request.headers );
        await new TimestampVerifier().verify(textBody);
        
        return skill
            .invoke(request.body)
            .then(( res ) => {
                return response
                    .status(200)
                    .send(res);
            })
            .catch((err) => {
                console.log("error alexa " + JSON.stringify(err));
                console.log(err);
                actualError = "error alexa " + JSON.stringify(err);
                return response
                    .status(400)
                    .send(err);
            });
    } catch (err) {
        actualError = err;
        return response
            .status(400)
            .send(err);
    }
});

app.get('/', (req, res, next) => {
    return res.status(200).json({ data: "hola mundo" , actualError  : actualError });
});

app.get('/history-list', (req, res, next) => {
    return res.status(200).json({ data: getHistoryList() , message : "Total de historial : "+getHistoryList().length });
});

//comment for firebase upload
/* app.listen(PORT, (req, res, next) => {
    console.log("App running in port " + PORT);
}); */

//Uncomment for firebase upload
const functions = require("firebase-functions");
exports.app = functions.https.onRequest(app);
