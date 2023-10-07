const bcrypt = require('bcrypt');
const saltRounds = 10;
const password = 'ao9=2js/a2-s247'

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