(function Crypter() {

    const fs = require("fs");

    const crypto = require("crypto");
    const algorithm = "aes-256-cbc";
    const key = "passwordpasswordpasswordpassword";
    const iv = crypto.randomBytes(16);

    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const designatedDir = __dirname + "/collection";

    function decrypt(encrypted) {
        let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(encrypted.iv, "hex"));
        let decrypted = decipher.update(Buffer.from(encrypted.encryptedData, "hex"));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    }

    function encrypt(buffer) {
        let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
        let encrypted = cipher.update(buffer);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return { iv: Buffer.from(iv).toString("hex"), encryptedData: encrypted.toString("hex") }; //{iv: iv.toString("hex"), data: encrypted.toString("hex")} // returns a buffer
    }

    function decryptAll() {
        let collection = fs.readdirSync(designatedDir);
        for (let i = 0; i < collection.length; i++) {
            let entry = fs.readFileSync(designatedDir + "/" + collection[i].toString());
            try {
                if (collection[i] != ".keep" && JSON.parse(entry).iv) {
                    fs.writeFileSync(designatedDir + "/" + collection[i].toString(), decrypt(JSON.parse(entry)));
                    console.log("'" + collection[i].toString() + "' is now decrypted.");
                }
            } catch (e) {
                console.log("'" + collection[i].toString() + "' did not need to be decrypted.");
            }
        }
    }

    function encryptAll() {
        let collection = fs.readdirSync(designatedDir);
        for (let i = 0; i < collection.length; i++) {
            let entry = fs.readFileSync(designatedDir + "/" + collection[i].toString());
            if (collection[i] != ".keep") {
                fs.writeFileSync(designatedDir + "/" + collection[i].toString(), JSON.stringify(encrypt(entry)));
                console.log("'" + collection[i].toString() + "' is now encrypted.");
            }
        }
    }

    function close() {
        encryptAll();
        console.log("Goodbye!");
        rl.close();
    }

    (function open() {
        console.log("Hello!");
        decryptAll();
    })();

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
})();