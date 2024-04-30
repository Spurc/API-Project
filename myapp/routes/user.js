var express = require('express');
const bcrypt = require("bcrypt");
const jsonwebtoken = require('jsonwebtoken');
const moment = require('moment');
const secretKey = "secret key";
const {authorize} = require('./authGetUser');
const {authorizePut} = require('./authPutUser');
var router = express.Router();

//Post the registration details to the database.
router.post('/register', function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
     
  if(!email || !password){
    res.status(400).json({
      "error": true,
      "message": "Request body incomplete, both email and password are required"
    })
    return;
  }

  //Check the user doesn't already exist.
  const checkUser = req.db.from('user').select("email").where("email", "=", email)
  checkUser
    .then((user) => {
      if(user.length > 0){
        res.status(409).json({
          "error": true, 
          "message": "User already exists"
        })
        return;
      }

    //If user doesnt exist create new user with hashed password.
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds)
    return req.db.from("user").insert([{"email": email, "password": hash}])
      .then(() => {
        res.status(201).json({
          "error": false,
          "message": "User created"
        })
      })        
    })
});

//Login in user and create JWT token.
router.post('/login', function(req, res, next) {
  const email = req.body.email;
  const password1 = req.body.password;

  //If neither email or password exist.
  if(!email || !password1){
    res.status(400).json({
      "error": true,
      "message": "Request body incomplete, both email and password are required"
    })
    return;
  }

  //Check if user trying to login in is listed in the database.
  const checkLogin = req.db.from("user").select("email", "password").where("email", "=", email)
  checkLogin
    .then((user) => {
      //If no user is located.
      if(user.length === 0){
        res.status(401).json({
          "error": true,
          "message": "Incorrect email or password"
        })
        return;
      }        

      //Compare both passwords to check if the match. If not return error.
      const { password } = user[0];
      if(!bcrypt.compareSync(password1, password)){
        res.status(401).json({
          "error": true,
          "message": "Incorrect email or password"
        })
        return;
      }
      
      //Generetate token upon succesffuly passing of errors.
      const expires_in = 60 * 60 * 24;
      const exp = Date.now() + expires_in * 1000;
      const token = jsonwebtoken.sign({email, exp}, secretKey)
      res.status(200).json({token, token_type: "Bearer", expires_in})
    })
    .catch((err => {
      console.log(err);
      res.status(500).json({
        "error": true,
        "message": "Error within server."
      })
    }))
});

//Get profile information.
router.get('/:email/profile', authorize, function(req, res, next) {
  const email = req.params.email;
  const noAuth = req.headers.authorization

  //If there is no auth header just display basic details.
  if(!noAuth){
    req.db.from('user').select("email", "firstName", "lastName")
    .where("email", "=", email)
    .then((rows) => {
      //If no user shows up display error.    
      if(rows.length === 0){
        res.status(404).json({
          "error": true,
          "message": "User not found"
        })
        return;
      }           
      res.status(200).json(rows[0])        
      return;            
    })
    .catch((err) => {
      console.log(err);
      res.json({
        "error" : true,
        "message" : "Error within server"})
    })
  }   
});

//Update a user's details.
router.put('/:email/profile', authorizePut, function(req, res, next){
  const email = req.params.email
  const firstName = req.body.firstName
  const lastName = req.body.lastName
  const dob = req.body.dob
  const address = req.body.address

  //Check if req.bodys exist:
  if(!firstName || !lastName || !dob || !address){
    res.status(400).json({
      "error": true,
      "message": "Request body incomplete: firstName, lastName, dob and address are required."
    })
    return;
  }

  //Check if date is in the past.
  const dateNow = new Date();
  const dateValue = new Date(dob)
  if(dateValue >= dateNow){
    res.status(400).json({
      "error": true,
      "message": "Invalid input: dob must be a date in the past."
    })
    return;
  }

  //Sourced from https://www.codegrepper.com/code-examples/whatever/regex+to+check+date+format+yyyy-mm-dd
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  //Check if date's format is correct.
  if (!(regex.test(dob)) || isNaN(dateValue)) {
    res.status(400).json({
      "error": true,
      "message": "Invalid input: dob must be a real date in format YYYY-MM-DD."
    })
    return;
  }

  //For checking if the req.body details are strings.
  const addressString = typeof address === 'string'
  const firstString = typeof firstName === 'string'
  const lastString = typeof lastName === 'string'

  //If either firstName, lastName or address are not strings display error.
  if(firstString === false || lastString === false || addressString === false){
    res.status(400).json({
      "error": true,
      "message": "Request body invalid: firstName, lastName and address must be strings only."
    })
    return;
  }  

  //If req.body is an empty string.
  if(address === "" || firstName === "" || lastName === ""){
    res.status(400).json({
      "error": true,
      "message": "Request body invalid: firstName, lastName and address must be strings only."
    })
    return;
  }

  //Using module moment check if date given is valid, including leap years.
  //Based around: https://www.sitepoint.com/managing-dates-times-using-moment-js/
  const validDate = moment(dob, 'YYYY-MM-DD', true).isValid()

  //If dob is not valid produce error.
  if(validDate === false){
    res.status(400).json({
      "error": true,
      "message": "Invalid input: dob must be a real date in format YYYY-MM-DD."
    })
    return;
  }

  //If user passes all error tests allow for update of details.
  req.db.from('user')
  .where("email", "=", email)
  .update({
    firstName,
    lastName,
    dob,
    address
  })
  .then((rows) => {
    req.db.from('user').select("email", "firstName", "lastName", "dob", "address")
    .where("email", "=", email)
    .then((result) => {
      //send the results of the update.
      res.status(200).json(result[0])      
      return;
    })
    .catch((err) => {
      console.log(err)
      res.status(500).json({
        "error": true,
        "message": "Error within server"
      })
      return;
    })
    
  })
  .catch((err) => {
    console.log(err)
    res.status(500).json({
      "error": true,
      "message": "Error within server"
    })
    return;
  })
});

module.exports = router;