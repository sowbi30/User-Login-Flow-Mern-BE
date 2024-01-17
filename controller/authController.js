const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
var bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt  = require("jsonwebtoken");
const { mailTransport, generatePasswordResetTemplate } = require('../utils/mail');
const transporter = mailTransport();
const keysecret = process.env.SECRET_KEY

const { 
    registerValidation, 
    loginValidation, 
    sendPasswordLinkValidation, 
    changePasswordValidation 
  } = require('../middleware/joiValidator');
  



// for user registration

exports.registerUser = async (req, res) => {
    const { fname, email, password, cpassword } = req.body;
    const { error } = registerValidation.validate(req.body);

    if (error) {
        return res.status(422).json({ error: error.details[0].message });
      }
    
    if (!fname || !email || !password || !cpassword) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {

        const preuser = await userdb.findOne({ email: email });

        if (preuser) {
            res.status(422).json({ error: "This Email is Already Exist" })
        } else if (password !== cpassword) {
            res.status(422).json({ error: "Password and Confirm Password Not Match" })
        } else {
            const finalUser = new userdb({
                fname, email, password, cpassword
            });

            // here password hasing

            const storeData = await finalUser.save();

            // console.log(storeData);
            res.status(201).json({ status: 201, storeData })
        }

    } catch (error) {
        res.status(422).json(error);
        console.log("catch block error");
    }

};




// user Login

exports.loginUser = async (req, res) => {
    console.log(req.body);

    const { email, password } = req.body;
    const { error } = loginValidation.validate(req.body);

  if (error) {
    return res.status(422).json({ error: error.details[0].message });
  }
    if (!email || !password) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {
       const userValid = await userdb.findOne({email:email});

        if(userValid){

            const isMatch = await bcrypt.compare(password,userValid.password);

            if(!isMatch){
                res.status(422).json({ error: "invalid details"})
            }else{

                // token generate
                const token = await userValid.generateAuthtoken();

                // cookiegenerate
                res.cookie("usercookie",token,{
                    expires:new Date(Date.now()+9000000),
                    httpOnly:true
                });

                const result = {
                    userValid,
                    token
                }
                res.status(201).json({status:201,result})
            }
        }else{
            res.status(401).json({status:401,message:"invalid details"});
        }

    } catch (error) {
        res.status(401).json({status:401,error});
        console.log("catch block");
    }
};



// user valid
exports.validUser = async (req, res) => {
    try {
        const ValidUserOne = await userdb.findOne({_id:req.userId});
        res.status(201).json({status:201,ValidUserOne});
    } catch (error) {
        res.status(401).json({status:401,error});
    }
};


// user logout

exports.logoutUser = async (req, res) => {
    try {
        req.rootUser.tokens =  req.rootUser.tokens.filter((curelem)=>{
            return curelem.token !== req.token
        });

        res.clearCookie("usercookie",{path:"/"});

        req.rootUser.save();

        res.status(201).json({status:201})

    } catch (error) {
        res.status(401).json({status:401,error})
    }
};



exports.sendPasswordLink = async (req, res) => {
    console.log(req.body);

    const { email } = req.body;
    const { error } = sendPasswordLinkValidation.validate(req.body);

    if (error) {
        return res.status(422).json({ error: error.details[0].message });
    }

    if (!email) {
        res.status(401).json({ status: 401, message: "Enter Your Email" });
    }

    try {
        const userfind = await userdb.findOne({ email: email });

        // token generate for reset password
        const token = jwt.sign({ _id: userfind._id }, keysecret, {
            expiresIn: "1h"
        });

        const setusertoken = await userdb.findByIdAndUpdate({ _id: userfind._id }, { verifytoken: token }, { new: true });

        if (setusertoken) {
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: "Sending Email For password Reset",
                html: generatePasswordResetTemplate(`${process.env.FRONTEND_URL}forgotpassword/${userfind.id}/${setusertoken.verifytoken}`)
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("error", error);
                    res.status(401).json({ status: 401, message: "email not sent" });
                } else {
                    console.log("Email sent", info.response);
                    res.status(201).json({ status: 201, message: "Email sent Successfully" });
                }
            });
        }

    } catch (error) {
        res.status(401).json({ status: 401, message: "invalid user" });
    }
};


// verify user for forgot password time
exports.forgotPassword = async (req, res) => {
    const { id, token } = req.params;
   
    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        
        const verifyToken = jwt.verify(token,keysecret);

        console.log(verifyToken)

        if(validuser && verifyToken._id){
            res.status(201).json({status:201,validuser})
        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }

    } catch (error) {
        res.status(401).json({status:401,error})
    }
};


// change password

exports.changePassword = async (req, res) => {
    const { id, token } = req.params;

    const {password} = req.body;
    const { error } = changePasswordValidation.validate(req.body);

    if (error) {
      return res.status(422).json({ error: error.details[0].message });
    }
    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        
        const verifyToken = jwt.verify(token,keysecret);

        if(validuser && verifyToken._id){
            const newpassword = await bcrypt.hash(password,12);

            const setnewuserpass = await userdb.findByIdAndUpdate({_id:id},{password:newpassword});

            setnewuserpass.save();
            res.status(201).json({status:201,setnewuserpass})

        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }
    } catch (error) {
        res.status(401).json({status:401,error})
    }
}



// 2 way connection
// 12345 ---> e#@$hagsjd
// e#@$hagsjd -->  12345

// hashing compare
// 1 way connection
// 1234 ->> e#@$hagsjd
// 1234->> (e#@$hagsjd,e#@$hagsjd)=> true



