const jsonwebtoken = require('jsonwebtoken');
const secretKey = "secret key";

//Authroization for put statement.
const authorizePut = function (req, res, next) {
    const authorization = req.headers.authorization
    let token = null
  
    //If authorization header exists and is malformed.
    if(authorization && authorization.split(" ").length !== 2){
      res.status(401).json({
        "error": true,
        "message": "Authroization header is malformed"
      })
      return;
    }
    
    //If both authorization header exists and well-formed get token.
    if(authorization && authorization.split(" ").length === 2){
      token = authorization.split(" ")[1]
    }
  
    try{
      //If no authorization header exists display error.
      if(!authorization){
        res.status(401).json({
          "error": true,
          "message": "Authorization header ('Bearer token') not found"
        })
        return;
      }
  
      const payload = jsonwebtoken.verify(token, secretKey)
      const decode = jsonwebtoken.decode(token)
      
      //If current email doesn't match the email attempting to be updated produce error.
      if(decode.email !== req.params.email){
        res.status(403).json({
          "error": true,
          "message": "Forbidden"
        })
        return;
      }
  
      //Check if token is valid (not expired)
      if(payload.exp < Date.now()){
        res.status(401).json({
          "error": true,
          "messgae": "JWT token has expired"
        })
        return;
      }
      //Exit auth.
      next()
    }
    catch (error){
      //Catch an in vaild token.
      res.status(401).json({
        "error": true,
        "message": "Invalid JWT token"
      })
      return;
    }
  }

module.exports = {authorizePut}