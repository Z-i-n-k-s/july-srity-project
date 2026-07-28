const express = require('express')

const router = express.Router()

const userSignUpController = require("../controller/User/userSignUp")
const userSignInController = require("../controller/User/userSignIn")
const userDetailsController = require('../controller/User/userDetails')
const authToken = require('../middleware/authToken')
const userLogout = require('../controller/User/userLogout')
const allUsers = require('../controller/User/allUsers')
const updateUser = require('../controller/User/updateUser')
const userSearchController = require('../controller/User/userSearch')
const userDeleteController = require('../controller/User/userDelete')

const updateProfile = require('../controller/User/updateProfile')
const userForgotPass = require('../controller/User/userForgotPass')
const userResetPass = require('../controller/User/userResetPass')
const verifyResetToken = require('../controller/User/verifyResetToken')


router.post("/signup",userSignUpController)
router.post("/signin",userSignInController)
router.get("/user-details",authToken,userDetailsController)
router.get("/userLogout",userLogout)


// Forgot password (send email)
router.post("/forgot-password", userForgotPass);

// Reset password (use token + new password)
router.post("/reset-password", userResetPass);

router.get("/verify-reset-token/:token", verifyResetToken);


//admin panel
router.get("/all-user",authToken,allUsers)
router.post("/user-search",userSearchController)
router.post("/update-user",authToken,updateUser)
router.post("/update-profile",authToken,updateProfile)
router.post("/delete-user",authToken,userDeleteController)



module.exports = router