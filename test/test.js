const bcrypt = require('bcrypt');
let saltRounds = 10;
let password = 'TESTING';


async function encrypt_password(password) {
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(hash);
        return hash;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
}

encrypt_password(password)