const jsonwebtoken = require('jsonwebtoken');
const secretKey = "secret key"

//Authorization for getting the user data.
//Usage can be found in routes/user 
const authorize = function (req, res, next) {
    const authorization = req.headers.authorization
    let token = null
  
    //Check if the authroization header isn't malformed if exists.
    if(authorization && authorization.split(" ").length !== 2){
      res.status(401).json({
        "error": true,
        "message": "Authorization header is malformed"
      })
      return;
    }
    
    //If header exists and is not malformed set token.
    if(authorization && authorization.split(" ").length === 2){
      token = authorization.split(" ")[1]
    }
  
    try{      
      //If no authorization exist exit auth.
      if(!authorization){
        next()
        return;
      }
  
      //Verify if token is valid.
      const payload = jsonwebtoken.verify(token, secretKey)
      const decode = jsonwebtoken.decode(token)
  
      //Check if token is valid (not expired)
      if(payload.exp < Date.now()){
        res.status(401).json({
          "error": true,
          "messgae": "JWT token has expired"
        })
        return;
      }
  
      //Check if the current user is the same as the one whose data is being accessed.
      if(decode.email !== req.params.email){
        //Give back unauthorized data if not logged in or not matching
        req.db.from('user').select("email", "firstName", "lastName")
        .where("email", "=", req.params.email)
        .then((rows) => {
          if(rows.length === 0){
            res.status(404).json({
              "error": true,
              "message": "User not found"
            })
            return; 
          }
          
          res.status(200).json(rows[0])
        })
        return;
      }
      else{
        //If authentication passes allow all data to be shown.
        const email = req.params.email;
        req.db.from('user').select("email", "firstName", "lastName", "dob", "address")
        .where("email", "=", email)
        .then((rows) => {
          if(rows.length === 0){
            res.status(404).json({
              "error": true,
              "message": "User not found"
            })
            return; 
          }
            
          res.status(200).json(rows[0])
        })
        .catch((err) => {
          console.log(err);
          res.json({"Error" : true, "Message" : "Error within server"})
          return;
        })
      } 
      //Exit auth.
      next()
    }
    catch (error){
        //Catch invalid token error.
        res.status(401).json({
            "error": true,
            "message": "Invalid JWT token."
        })
        return;
    }
}

  module.exports = {authorize}