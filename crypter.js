(function Crypter() {
    const fs = require("fs");

    const crypto = require("crypto");
    //const algorithm = "aes-256-cbc";
    //const key = crypto.randomBytes(32);/*"passwordpasswordpasswordpassword";*/ // TODO: generate and preserve generation
    //const iv = crypto.randomBytes(16);

    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const designatedDir = __dirname + "/collection";

    function createCryptoSuite(algorithm, key) {
        const iv = crypto.randomBytes(16);
        return {
            decrypt: function decrypt(encrypted) {
                let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(encrypted.iv, "hex"));
                let decrypted = decipher.update(Buffer.from(encrypted.encryptedData, "hex"));
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                return decrypted;
            },
            encrypt: function encrypt(buffer) {
                let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
                let encrypted = cipher.update(buffer);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return { iv: Buffer.from(iv).toString("hex"), encryptedData: encrypted.toString("hex") }; //{iv: iv.toString("hex"), data: encrypted.toString("hex")} // returns a buffer
            },
            decryptAll: function decryptAll() {
                let collection = fs.readdirSync(designatedDir);
                for (let i = 0; i < collection.length; i++) {
                    let entry = fs.readFileSync(designatedDir + "/" + collection[i].toString());
                    try {
                        if (collection[i] != ".keep" && JSON.parse(entry).iv) {
                            fs.writeFileSync(designatedDir + "/" + collection[i].toString(), this.decrypt(JSON.parse(entry)));
                            console.log("'" + collection[i].toString() + "' is now decrypted.");
                        }
                    } catch (e) {
                        console.log("'" + collection[i].toString() + "' did not need to be decrypted.");
                    }
                }
            },
            encryptAll: function encryptAll() {
                let collection = fs.readdirSync(designatedDir);
                for (let i = 0; i < collection.length; i++) {
                    let entry = fs.readFileSync(designatedDir + "/" + collection[i].toString());
                    if (collection[i] != ".keep") {
                        fs.writeFileSync(designatedDir + "/" + collection[i].toString(), JSON.stringify(this.encrypt(entry)));
                        console.log("'" + collection[i].toString() + "' is now encrypted.");
                    }
                }
            }
        }
    }

    function verify(passHash) {
        rl.question("What is the password?\n", function (answer) {
            answer = crypto.createHash("md5").update(answer, "utf8").digest("hex");

            if (answer == passHash) {
                const cryptoSuite = createCryptoSuite("aes-256-cbc", passHash.slice(0, 32));
                
                function open() {
                    console.log("Welcome to Crypter.");
                    cryptoSuite.decryptAll();
                };

                function close() {
                    cryptoSuite.encryptAll();
                    console.log("Goodbye!");
                    rl.close();
                }

                open();

                rl.on("line", function (line) {
                    switch (line.toLowerCase()) {
                        case "bye":
                        case "goodbye":
                        case "exit":
                        case "gg":
                        case "q":
                        case "quit":
                        case "abort":
                        case "stop":
                        case "close":
                        case "end":
                            close();
                            break;
                        default:
                            console.log("Sorry, I don't understand what '" + line + "' means.");
                            break;
                    }
                });

                rl.on("SIGINT", function () {
                    close();
                });
            } else {
                console.log("Your answer is incorrect.");
                verify(passHash);
            }
        });
    };

    fs.readFile(__dirname + "/initial.json", function (err, data) {
        if (err) {
            console.log("'initial.json' cannot be found. Crypter is closing.");
            process.exit();
        }
        data = JSON.parse(data);

        if (!data.hasOwnProperty("passHash")) {
            console.log("Crypter is initializing...");

            function initialize(password) {
                data.passHash = crypto.createHash("md5").update(password, "utf8").digest("hex");
                fs.writeFile(__dirname + "/initial.json", JSON.stringify(data), function () {
                    console.log("Crypter has finished initializing.");
                    verify(data.passHash);
                });
            }

            rl.question("Set your password: ", function (password) {
                console.log("Thank you.");
                initialize(password);
            });
        } else {
            verify(data.passHash);
        }
    });
})();