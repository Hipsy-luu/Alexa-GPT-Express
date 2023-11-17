const ErrorHandler = {
    canHandle: (handlerInput , error ) => {
        return true;
    },
    handle: ( handlerInput , error ) => {
        console.log("Error handled en stringify : " + error.message + " " + JSON.stringify(error));
        //console.log("---------------------------------------------------");

        return handlerInput.responseBuilder
            .speak("Lo siento, No puede entenderte. Puedes repetírmelo.")
            .reprompt("Lo siento, No puede entenderte. Puedes repetírmelo.")
            .getResponse();
    },
};

module.exports = {
    ErrorHandler,
}