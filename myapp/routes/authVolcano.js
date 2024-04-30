const jsonwebtoken = require('jsonwebtoken');
const secretKey = "secret key"

//Creates the authorization of individual volcano data. 
//Usage found in routes/volcano.js
const authorize = function (req, res, next) {
    const authorization = req.headers.authorization
    let token = null

    //Check if authorization header exists and if its malformed produce an error.
    if(authorization && authorization.split(" ").length !== 2){
      res.status(401).json({
        "error": true,
        "message": "Authorization header is malformed"
      })
      return;
    }
    
    //If authorization header exists and is well-formed produce token.
    if(authorization && authorization.split(" ").length === 2){
      token = authorization.split(" ")[1]
    }  
  
    try{
      //If no authorization header exists exit auth function.
      if(!authorization){
        next()
        return;
      }
      
      //Check if token is valid and token is not expired.
      const payload = jsonwebtoken.verify(token, secretKey)  
      if(payload.exp < Date.now()){
        res.status(401).json({
          "error": true,
          "messgae": "JWT token has expired"
        })
        return;
      }
      //If token is vaild fetch all data.
      else{
        const id = req.params.id;
        req.db.from('data').select("*")
        .where("id", "=", id)
        .then((rows) => {
          res.status(200).json(rows[0])
        })
        .catch((err) => {
          res.status(500).json({"Error" : true, "Message" : "Error within server"})
          return;
        })
      }
      next()
    }
    catch (error){
      //Catch invalid token.
      res.status(401).json({
        "error": true,
        "message": "Invalid JWT token"
      })
      return;
    }
  }

module.exports = {authorize}