
// función para construir la respuesta del servidor hacia la skill
function sendNextMessage(handlerInput/* : HandlerInput */, speechText, endSession /* : boolean */ = false, loginCard /* : boolean */ = false) {
    if (loginCard) {
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            //.withSimpleCard("Titulo de la tarjeta", speechText)
            .withShouldEndSession(endSession)
            //.withLinkAccountCard()
            .getResponse();
    } else {
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            //.withSimpleCard("Titulo de la tarjeta", speechText)
            .withShouldEndSession(endSession)
            .getResponse();
    }
}

module.exports = {
    sendNextMessage,
}