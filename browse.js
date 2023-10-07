const { defaultPassword } = require('./constant');
const { infoAsync, errorAsync } = require('./apputils');

const LOW = 60000;
const MEDIUM = 90000;

async function searchUser(page, url, username) {
    await page.goto(`${url}/clients`, { timeout: 9000 });
    await page.waitForSelector('#root > div.bethubs > div > div > div > div > div > div:nth-child(1) > h5 > div > div.col-12.col-sm-8.col-md-8.col-lg-8.col-xl-8 > div > div:nth-child(1) > input', { timeout: 9000 })
        .then(element => element.type(username));
    const element = await page.waitForSelector('#example > tbody > tr:nth-child(2) > td:nth-child(1) > span:nth-child(2)', { timeout: 3000 })
        .catch(() => false);
    let innerText = await page.evaluate((ele) => ele.textContent, element);
    return innerText === username;
}

async function login(page, url, username, password) {
    await page.goto(url, { timeout: 90000 });
    await page.waitForSelector('body > div > div > div:nth-child(2) > div:nth-child(1) > input', { timeout: 12000 })
        .then(element => element.type(username));
    await page.type('#passcode', password);
    await page.click('body > div > div > div:nth-child(2) > div:nth-child(3) > button');
    await page.waitForNavigation({ timeout: 120000 });
    infoAsync(`login successful, url: ${url}`);
}

async function register(page, url, username, masterPass) {
    try {
        let userFound = await searchUser(page, url, username);
        if (userFound)
            return { success: false, message: 'username already exist' };
        await page.goto(`${url}/addclient`);
        const selector = '#root > div.bethubs > div > div > div > div > div > div.row.supermaster.mt-3 > div:nth-child(1) > fieldset > div > div:nth-child(1) > div > select';
        await page.waitForFunction(
            selector => !!document.querySelector(selector),
            { timeout: 70000 },
            selector
        );
        await page.evaluate(`document.querySelector('#root > div.bethubs > div > div > div > div > div > div.row.supermaster.mt-3 > div:nth-child(1) > fieldset > div > div:nth-child(1) > div > select').value='Client'`);



        await page.waitForSelector('#root > div.bethubs > div > div > div > div > div > div.row.supermaster.mt-3 > div:nth-child(1) > fieldset > div > div:nth-child(2) > div > input', { timeout: 10000 })
            .then(ele => ele.type(username));
        await page.waitForSelector('#usrid', { timeout: 10000 })
            .then(ele => ele.type(username));
        await page.waitForSelector('#password', { timeout: 10000 })
            .then(ele => ele.type(defaultPassword));
        await page.waitForSelector('#repassword', { timeout: 10000 })
            .then(ele => ele.type(defaultPassword));
        await page.waitForSelector('input[name="master_password"]', { timeout: 10000 })
            .then(ele => ele.type(masterPass + '\n'));
        await console.log('Before waiting for navigation after form submission');
        await page.waitForNavigation({ timeout: 12000 });
        await console.log('after waiting for navigation after form submission');
        return { success: true, message: 'user created' };

    } catch (error) {
        errorAsync(error.message);
        return { success: false, error: error.message };
    }
}

async function resetPass(page, url, username) {
    try {
        await searchUser(page, url, username);
        await page.click('body > main > div > table > tbody > tr:nth-child(1) > td.col.s12.hide-on-med-and-down > div > a:nth-child(6)');

        await page.waitForSelector('body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-text');
        await page.evaluate(`document.querySelector('body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-footer > div:nth-child(2) > button').click();`);

        await page.waitForSelector('body > main > div:nth-child(1) > div > ul > li');
        let element = await page.$('body > main > div:nth-child(1) > div > ul > li');
        let value = await page.evaluate(el => el.textContent, element);

        return { success: true, message: value.trim() };
    } catch (error) {
        errorAsync(error.message);
        return { success: false, error: error.message };
    }
}

async function lockUser(page, url, username) {
    try {
        await searchUser(page, url, username);

        let alreadyLocked = await page.evaluate(`document.querySelector('body > main > div > table > tbody > tr:nth-child(1) > td:nth-child(7) > a').classList.contains('red')`);
        if (alreadyLocked) {
            return { success: true, message: 'already locked' };
        }

        await page.waitForSelector(`body > main > div > table > tbody > tr:nth-child(1) > td:nth-child(7) > a`)
            .then(element => element.click())

        await page.evaluate(`
            document.querySelector('body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-footer > div:nth-child(2) > button').click()
        `);

        await page.waitForSelector('body > main > div:nth-child(1) > div > ul > li');
        let element = await page.$('body > main > div:nth-child(1) > div > ul > li');
        let value = await page.evaluate(el => el.textContent, element);

        return { success: true, message: value.trim() };
    } catch (error) {
        return { success: false, message: error.message };
    }
}


async function deposit(page, url, username, amount) {
    try {
        await searchUser(page, url, username);
        await page.click('body > main > div > table > tbody > tr:nth-child(1) > td.col.s12.hide-on-med-and-down > div > a:nth-child(2)');
        await page.waitForSelector('#amount', { timeout: 9000 });

        let res = await page.evaluate(`
            document.querySelector('#amount').value = ${amount};
            document.querySelector('button[type="submit"]').click();
        `);

        await page.waitForSelector('body > main > div:nth-child(1) > div > ul > li');
        let element = await page.$('body > main > div:nth-child(1) > div > ul > li');
        let value = await page.evaluate(el => el.textContent, element);

        return {
            success: !value.includes('Insufficient'),
            message: value.trim()
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function withdraw(page, url, username, amount) {
    try {
        await searchUser(page, url, username);
        await page.click('body > main > div > table > tbody > tr:nth-child(1) > td.col.s12.hide-on-med-and-down > div > a:nth-child(3)');
        await page.waitForSelector('#amount', { timeout: 9000 });

        let res = await page.evaluate(`
            document.querySelector('#amount').value = ${amount};
            document.querySelector('button[type="submit"]').click();
        `);

        await page.waitForSelector('body > main > div:nth-child(1) > div > ul > li');
        let element = await page.$('body > main > div:nth-child(1) > div > ul > li');
        let value = await page.evaluate(el => el.textContent, element);

        return {
            success: !value.includes('Insufficient'),
            message: value.trim()
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

module.exports = {
    login: login,
    register: register,
    lockUser: lockUser,
    deposit: deposit,
    withdraw: withdraw,
    resetPass: resetPass
}