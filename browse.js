const { defaultPassword } = require('./constant');
const { infoAsync, errorAsync } = require('./apputils');

const TINY = 3000;
const LOW = 60000;
const MEDIUM = 90000;
const HIGH = 120000;

async function searchUser(page, url, username) {
    await page.goto(`${url}/clients`, { timeout: 9000 });
    await page.waitForFunction(
        () => !!document.querySelector('#root > div > div > div > div > div > div > div > h5 > div > div > div > div > input')
    );
    await page.focus(
        '#root > div > div > div > div > div > div > div > h5 > div > div > div > div > input',
        { timeout: 9000 }
    );
    await page.keyboard.type(username);

    await page.waitForFunction(() => !!document.querySelector('tbody > tr:nth-child(2) > td'), { timeout: TINY })
        .catch(err => false);
    const result = await page.evaluate(() => document.querySelector('tbody > tr:nth-child(2) > td').title)
        .catch((err) => '');

    return result === username;
}

async function login(page, url, username, password) {
    await page.goto(url, { timeout: 90000 });

    await page.waitForFunction(() => !!document.querySelector('input[name="uid"]'));
    await page.focus('input[name="uid"]');
    await page.keyboard.type(username);

    await page.waitForFunction(() => !!document.querySelector('#passcode'));
    await page.focus('#passcode');
    await page.keyboard.type(password);

    await page.waitForFunction(() => !!document.querySelector('div.login > div:nth-child(2) button'));
    const navPromise = page.waitForNavigation({ timeout: HIGH });
    await page.click('div.login > div:nth-child(2) button');

    await navPromise;

    infoAsync(`login successful, url: ${url}`);
}

async function register(page, searchPage, url, username, masterPass) {
    try {
        const waitPromise = page.waitForNavigation({ timeout: HIGH });
        await page.goto(`${url}/addclient`, { timeout: HIGH });
        await waitPromise;

        let userFound = await searchUser(searchPage, url, username);
        if (userFound)
            return { success: false, message: 'username already exist' };

        await page.waitForFunction(() => !!document.querySelector('select[name="account_type"]'), { timeout: TINY })
            .catch(err => console.log('1' + err.message));
        await page.focus('select[name="account_type"]');
        await page.keyboard.press('ArrowDown');

        await page.waitForFunction(() => !!document.querySelector('input[name="client_name"]'), { timeout: TINY })
            .catch(err => console.log('2' + err.message));
        await page.focus('input[name="client_name"]');
        await page.keyboard.type(username);

        await page.waitForFunction(() => !!document.querySelector('#usrid'), { timeout: TINY })
            .catch(err => console.log('3' + err.message));
        await page.focus('#usrid');
        await page.keyboard.type(username);

        await page.waitForFunction(() => !!document.querySelector('#password'), { timeout: TINY })
            .catch(err => console.log('4' + err.message));
        await page.focus('#password');
        await page.keyboard.type(defaultPassword);

        await page.waitForFunction(() => !!document.querySelector('#repassword'), { timeout: TINY })
            .catch(err => console.log('5' + err.message));
        await page.focus('#repassword');
        await page.keyboard.type(defaultPassword);

        await page.waitForFunction(() => !!document.querySelector('input[name="master_password"]'), { timeout: TINY })
            .catch(err => console.log('6' + err.message));
        await page.focus('input[name="master_password"]');
        await page.keyboard.type(masterPass);
        await page.keyboard.press('Enter');

        await page.waitForFunction(() => !!document.querySelector('div[role="alert"] > div:nth-child(2)'), { timeout: TINY })
            .catch(err => console.log('7' + err.message));
        let message = await page.evaluate(() => document.querySelector('div[role="alert"] > div:nth-child(2)').innerText);

        return { success: true, message: message };

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