const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const concatHash = require("../methods/concat_hash");

const saltRounds = 10;

// middleware
router.use(bodyParser.urlencoded({ extended: true }));

// Forget password route
router
  .route("/")
  .get((req, res) => {
    res.render("forget-password");
  })
  .post((req, res) => {
    // retrieve information from request
    const email = req.body.email;
    const password = req.body.password;
    const word1 = req.body.word1;
    const word2 = req.body.word2;
    const word3 = req.body.word3;
    User.findOne({ email: email }, (err, user) => {
      if (err) {
        console.log("User not found");
        const errorHeading = "User not found";
        const errorText =
          "Please make sure you have inputted the correct email";
        const errorBtnText = "Head back to Forget Password";
        const redirectLink = "/forget-password";
        res.render("error", {
          errorHeading: errorHeading,
          errorText: errorText,
          errorBtnText: errorBtnText,
          redirectLink: redirectLink,
        });
      } else {
        // check recovery hash
        const plaintext = concatHash([word1, word2, word3]);
        bcrypt.compare(plaintext, user.recovery_hash, function (err, result) {
          if (err) {
            console.log("Something went wrong when comparing recovery-hash");
            console.log(err);
            const errorHeading = "Oops! Something happened";
            const errorText =
              "Something went wrong internally, please try again later";
            const errorBtnText = "Head back to Forget Password";
            const redirectLink = "/forget-password";
            res.render("error", {
              errorHeading: errorHeading,
              errorText: errorText,
              errorBtnText: errorBtnText,
              redirectLink: redirectLink,
            });
          }
          // result == true, then update new password
          if (result) {
            const generator = require("../methods/rand_words");
            const output = generator(3);
            const new_recovery_text = concatHash(output);
            bcrypt.hash(
              new_recovery_text,
              saltRounds,
              function (err, recoveryHash) {
                console.log("[Previous Hash] " + user.recovery_hash);

                console.log("[User Email] " + user.email);
                User.updateOne(
                  { email: user.email },
                  { recovery_hash: recoveryHash },
                  (err) => {
                    if (err) {
                      console.log(err);
                      const errorHeading = "Oops! Something happened";
                      const errorText =
                        "Something went wrong internally, please try again later";
                      const errorBtnText = "Head back to Forget Password";
                      const redirectLink = "/forget-password";
                      res.render("error", {
                        errorHeading: errorHeading,
                        errorText: errorText,
                        errorBtnText: errorBtnText,
                        redirectLink: redirectLink,
                      });
                    }
                    user.setPassword(password).then(() => {
                      user.save();
                    });
                    console.log("[New Hash] " + recoveryHash);
                    console.log("Update complete");

                    // render after-register page
                    res.render("after-register", {
                      word1: output[0],
                      word2: output[1],
                      word3: output[2],
                      redirectLink: "/",
                      redirectLinkText: "Proceed back to Login",
                    });
                  }
                );
              }
            );
          } else {
            // redirect to error page
            const errorHeading = "Invalid recovery hash";
            const errorText = "Please input it again";
            const errorBtnText = "Head back to Forget Password";
            const redirectLink = "/forget-password";
            res.render("error", {
              errorHeading: errorHeading,
              errorText: errorText,
              errorBtnText: errorBtnText,
              redirectLink: redirectLink,
            });
          }
        });
      }
    });
  });

module.exports = router;
