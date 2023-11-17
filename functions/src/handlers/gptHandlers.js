// Variables de entorno
const { gptOrganization, gptApiKey } = require('../utils/config');

const OpenAI = require("openai");

const openai = new OpenAI({
    organization: gptOrganization,
    apiKey: gptApiKey // defaults to process.env["OPENAI_API_KEY"]
});

// función para construir la respuesta del servidor hacia la skill
const { sendNextMessage } = require('../utils/utils');

const RequestHandler  = {
    canHandle: (handlerInput/* : HandlerInput */) => {
        return handlerInput.requestEnvelope.request.type === "LaunchRequest" ||
            handlerInput.requestEnvelope.request.type === "IntentRequest" ||
            handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
    },
    handle: async (handlerInput/* : HandlerInput */) => {
        let speechText = "";

        console.log(handlerInput.requestEnvelope.request.type);

        if (handlerInput.requestEnvelope.request.type === "SessionEndedRequest") {
            console.log("   Cerrando sesión");
            return sendNextMessage(handlerInput, "", true);
        } else {
            if (handlerInput.requestEnvelope.request.type === "LaunchRequest") {
                return sendNextMessage(handlerInput,"Bienvenido amo supremo ¿como te puedo ayudar?",false,true);
            } else if (handlerInput.requestEnvelope.request.type === "IntentRequest") {
                let intentName = handlerInput.requestEnvelope.request.intent.name;

                console.log("       Se requiere la opción (intent) " + intentName);
                //console.log( JSON.stringify( handlerInput ) );

                //Intents of functions called by the user in the skill
                //      AMAZON.NavigateHomeIntent = "inicio" // no jalo inicio
                //      AMAZON.StopIntent = "cerrar","detente gracias","detener consulta","es todo gracias"
                //      AMAZON.CancelIntent = "nueva","nueva consulta","cancelar","ok gracias"
                //      AMAZON.HelpIntent = "que puedes hacer","como se usa","dime las instrucciones","instrucciones"
                //      ConsultarIntent = "adelante","por favor","si"
                //      ConsultarIntent = "que respondio","dime el resultado","respuesta","resultado","consultar"
                //      ActualIntent = "ultima pregunta","ultima consulta","que entendiste","que dije","que pregunte", "consulta actual"
                //      ActivateInfiniteIntent = "desactivar limite","activar sin limites","modo sin limites"
                //      DeactivateInfiniteIntent = "modo con limites","modo limitado","activar limites","activar limite","limitar","","",""
                //      TellConfigIntent = "estatus","configuracion"
                //      ChatIntent = {lo_que_sea}

                if (intentName == 'AMAZON.StopIntent') {
                    return sendNextMessage(handlerInput, " hasta luego, bebé", true);
                } else if (intentName == 'AMAZON.CancelIntent') {
                    // Se reinician las variables para permitir una nueva petición
                    doingGptConsult = false;
                    
                    responseAlready = true;
                    actualPetition = "";
                    // Se marca como leída la petición actual
                    alreadyRead = true;

                    return sendNextMessage(handlerInput, "¿En que te puedo ayudar?", false, false);
                } else if (intentName == 'ActivateInfiniteIntent') {
                    // Se reinician las variables para permitir una nueva petición
                    isLimited = false;

                    return sendNextMessage(handlerInput, "Límites desactivados", false, false);
                } else if (intentName == 'DeactivateInfiniteIntent') {
                    // Se reinician las variables para permitir una nueva petición
                    isLimited = true;

                    return sendNextMessage(handlerInput, "Límites activados, numero de tokens permitidos : " + maxTokens, false, false);
                }  else if (intentName == 'ConsultarIntent') {
                    if( doingGptConsult ){
                        await new Promise(r => setTimeout(r, 4000));
                        return sendNextMessage(handlerInput,"Petición en curso, di 'cancelar' para nueva consulta",false,false,);
                    }
                    
                    if( actualGptResponse.length == 0 ){
                        return sendNextMessage(handlerInput,"Aun no hay consultas ¿En que te puedo ayudar?",false,false,);
                    }
                    // Se marca como leída la petición actual
                    alreadyRead = true;

                    return sendNextMessage(handlerInput, actualGptResponse, false, false);
                } else if ( intentName == 'ChatIntent' ) {
                    if( doingGptConsult ){
                        await new Promise(r => setTimeout(r, 4000));
                        return sendNextMessage(handlerInput,"Petición en curso, di 'cancelar' para nueva consulta",false,false,);
                    }
                    
                    if(!alreadyRead){
                        return sendNextMessage(handlerInput,"Tienes una consulta sin ver, por favor di 'consultar' para ver el resultado",false,false,);
                    }

                    createGPTResponse( handlerInput.requestEnvelope.request.intent.slots.any.value);

                    await new Promise(r => setTimeout(r, 4000));

                    return sendNextMessage(handlerInput,"Procesando, dame un momento por favor, di 'consultar' para ver el resultado",false,false);
                } else if (intentName == 'AMAZON.HelpIntent') {
                    let msg = "Con esta skill de Hipsy Home, puedes usar la I A de chat GPT para hacer consultas o preguntas " +
                    " de cualquier tema, solo dí . 'Alexa, tengo dudas'. y espera que la I A te responda." +
                    " ¿deseas preguntar algo mas?";
                    
                    return sendNextMessage( handlerInput, msg, false, false, );
                } else if (intentName == 'TellConfigIntent') {
                    let msg = "La configuracion actual es : ";
                    msg+= ". \n El límite se encuentra " + ( isLimited ? "activado" : "desactivado");
                    msg+= ". \n " + (alreadyRead ? " No hay consultas sin leer" : "Hay consultas pendientes");
                    msg+= ". \n El límite de tokens es " + maxTokens;
                    msg+= ". \n La cantidad de consultas en el historial es de  " + historyList.length;

                    return sendNextMessage( handlerInput, msg, false, false, );
                } else if (intentName == 'HelpNextStepIntent') {
                    return sendNextMessage( handlerInput," ¿con que te puedo ayudar?",false,false);
                } else {
                    speechText = "aun no se tiene un comando para este intent";
                }
            }

            return sendNextMessage(handlerInput, speechText, false);
        }
    },
};

let actualGptResponse = "";
let actualPetition = "";
let lastPetition = "";
let responseAlready = true;
let doingGptConsult = false;
let alreadyRead = true;
let maxTokens = 75;
let isLimited = true;
let historyList = [];

async function createGPTResponse(message){
    return new Promise( async (resolve, reject) =>{
        try {
            console.log("Diciéndole a GPT : " + message);
    
            doingGptConsult = true;
            responseAlready = false;
            alreadyRead = false;
            actualPetition = message;
            actualGptResponse = "";
    
            let actualData = {
                query : message,
                createdAt : new Date(),
            };
            
            const start = new Date();
            console.log("       EMPEZANDO -nueva consulta");
    
            let query = {
                messages: [
                    //{ "role": "system", "content": "Eres un experto en contar historias de terror para adultos, que esta en una noche de sábado en la casa de sus amigos" },
                    { "role": "user","content": " " + actualPetition }
                ],
                model: "gpt-3.5-turbo",
                /* temperature : 0.7,
                presence_penalty : 0.5, */
            };
    
            if( isLimited )
                query.max_tokens = maxTokens;
    
            //Se manda la query a la api por medio de la librería que nos da el objeto
            const completion = await openai.chat.completions.create(query);
    
            const end = new Date();
    
            console.log("       TERMINANDO -consulta " + (end.getTime() - start.getTime()) + "ms");
            console.log( "          RESPUESTA GPT : " + completion.choices[0].message.content);
    
            // Si por alguna razón se cancelo la petición anterior no la borramos
            if( doingGptConsult ){
                doingGptConsult = false;
                responseAlready = true;
                actualPetition = "";
                lastPetition = message;
                actualGptResponse = /* "respuesta actual de g p t" +  */completion.choices[0].message.content;
    
                actualData.gptResponse = actualGptResponse;
    
                historyList.push(actualData);
    
                if(historyList.length > 100)
                    historyList.pop();
            }
        } catch (error) {
            console.log(error);
        }

        resolve();
    });
}

function getHistoryList(){
    return historyList;
}

module.exports = {
    RequestHandler,
    getHistoryList
}