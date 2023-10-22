const { defaultPassword } = require('./constant');
const { infoAsync, errorAsync } = require('./apputils');

const TINY = 3000;
const TINY_DECADE = 10000;
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

    await page.waitForFunction(() => !!document.querySelector('div[role="alert"] > div:nth-child(2)'), { timeout: 3 * TINY_DECADE })
        .catch(err => err.message);
    let message = await page.evaluate(() => document.querySelector('div[role="alert"] > div:nth-child(2)').innerText)
        .catch(err => '');

    if (message.includes('invalid'))
        throw new Error(message);

    // await navPromise;

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
            .catch(err => erro('1: ' + err.message));
        await page.focus('select[name="account_type"]');
        await page.keyboard.press('ArrowDown');

        await page.waitForFunction(() => !!document.querySelector('input[name="client_name"]'), { timeout: TINY })
            .catch(err => erro('2: ' + err.message));
        await page.focus('input[name="client_name"]');
        await page.keyboard.type(username);

        await page.waitForFunction(() => !!document.querySelector('#usrid'), { timeout: TINY })
            .catch(err => erro('3: ' + err.message));
        await page.focus('#usrid');
        await page.keyboard.type(username);

        await page.waitForFunction(() => !!document.querySelector('#password'), { timeout: TINY })
            .catch(err => erro('4: ' + err.message));
        await page.focus('#password');
        await page.keyboard.type(defaultPassword);

        await page.waitForFunction(() => !!document.querySelector('#repassword'), { timeout: TINY })
            .catch(err => erro('5: ' + err.message));
        await page.focus('#repassword');
        await page.keyboard.type(defaultPassword);

        await page.waitForFunction(() => !!document.querySelector('input[name="master_password"]'), { timeout: TINY })
            .catch(err => erro('6: ' + err.message));
        await page.focus('input[name="master_password"]');
        await page.keyboard.type(masterPass);
        await page.keyboard.press('Enter');

        await page.waitForFunction(() => !!document.querySelector('div[role="alert"] > div:nth-child(2)'), { timeout: TINY })
            .catch(err => erro('7: ' + err.message));
        let message = await page.evaluate(() => document.querySelector('div[role="alert"] > div:nth-child(2)').innerText);

        return { success: true, message: message };

    } catch (error) {
        errorAsync(error.message);
        return { success: false, error: error.message };
    }
}

async function resetPass(page, url, username, pass, masterPass) {
    try {
        let userFound = await searchUser(page, url, username);
        if (!userFound)
            return { success: false, message: 'no such username' };

        await page.waitForFunction(() => !!document.querySelector('span[title="Password Change"'));
        await page.click('span[title="Password Change"');

        await page.waitForFunction(() => !!document.querySelector('input[name="passcode"]'));
        await page.focus('input[name="passcode"]');
        await page.keyboard.type(pass);

        await page.waitForFunction(() => !!document.querySelector('input[name="repasscode"]'));
        await page.focus('input[name="repasscode"]');
        await page.keyboard.type(pass);

        await page.waitForFunction(() => !!document.querySelector('input[name="mpassword"]'));
        await page.focus('input[name="mpassword"]');
        await page.keyboard.type(masterPass);

        await page.waitForFunction(() => !!document.querySelector('div.modal-footer > a:nth-child(1)'));
        await page.click('div.modal-footer > a:nth-child(1)');

        await page.waitForFunction(() => !!document.querySelector('div[role="alert"] > div:nth-child(2)'), { timeout: TINY })
        let message = await page.evaluate(() => document.querySelector('div[role="alert"] > div:nth-child(2)').innerText);

        let success = (message === 'Password Updated Successfully!');
        return {
            success: success,
            message: success ? `Password Update Successfully to ${pass}` : message
        };
    } catch (error) {
        errorAsync(error.message);
        return { success: false, error: error.message };
    }
}

async function lockUser(page, url, username, masterPass) {
    try {
        let userFound = await searchUser(page, url, username);
        if (!userFound)
            return { success: false, message: 'no such username' };

        await page.waitForFunction(() => document.querySelector('tbody > tr:nth-child(2) > td:nth-child(8)  input'))
        let alreadyLocked = await page.evaluate(`document.querySelector('tbody > tr:nth-child(2) > td:nth-child(8)  input').checked`);
        if (alreadyLocked) {
            return { success: true, message: 'already locked' };
        }

        await page.evaluate(() => document.querySelector('tbody > tr:nth-child(2) > td:nth-child(8) input').click());

        await page.waitForFunction(() => !!document.querySelector('input[name="mpassword"]'));
        await page.focus('input[name="mpassword"]');
        await page.keyboard.type(masterPass);

        await page.waitForFunction(() => !!document.querySelector('div.modal-footer > a:nth-child(1)'));
        await page.click('div.modal-footer > a:nth-child(1)');

        await page.waitForFunction(() => !!document.querySelector('div[role="alert"] > div:nth-child(2)'), { timeout: TINY })
        let message = await page.evaluate(() => document.querySelector('div[role="alert"] > div:nth-child(2)').innerText);

        return {
            success: message.includes('Unlocked') ? false : true,
            message: message
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function deposit(page, url, username, amount, masterPass) {
    try {
        let userFound = await searchUser(page, url, username);
        if (!userFound)
            return { success: false, message: 'no such username' };

        await page.waitForFunction(() => !!document.querySelector('span[title="Deposit / Credit"'));
        await page.click('span[title="Deposit / Credit"');

        await page.waitForFunction(() => !!document.querySelector('input[name="amount"]'));
        await page.focus('input[name="amount"]');
        await page.keyboard.type(amount);

        await page.waitForFunction(() => !!document.querySelector('input[name="mpassword"]'));
        await page.focus('input[name="mpassword"]');
        await page.keyboard.type(masterPass);
        await page.keyboard.press('Enter');

        await page.waitForFunction(() => !!document.querySelector('div[role="alert"] > div:nth-child(2)'), { timeout: TINY })
        let message = await page.evaluate(() => document.querySelector('div[role="alert"] > div:nth-child(2)').innerText);

        return {
            success: message.includes('successfully!') && !message.includes('not'),
            message: message
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function withdraw(page, url, username, amount, masterPass) {
    try {
        let userFound = await searchUser(page, url, username);
        if (!userFound)
            return { success: false, message: 'no such username' };

        await page.waitForFunction(() => !!document.querySelector('span[title="Withdraw"'));
        await page.click('span[title="Withdraw"]');

        await page.waitForFunction(() => !!document.querySelector('#deposite-first'));
        let available = await page.evaluate(() => !!document.querySelector('#deposite-first').innerText);

        if (parseInt(available) < parseInt(amount))
            return { success: false, message: 'Insufficient Balance!' };

        await page.focus('input[name="amount"]');
        await page.keyboard.type(amount);

        let toThrow = false;
        try {
            await page.waitForFunction(
                () => !!document.querySelector('#mywithdraw > div.modal-dialog.modal-dialog-scrollable > div > div.modal-body.lst-pop.pt-0 > div:nth-child(7) > div > span'),
                { timeout: TINY }
            );

            let innerText = await page.$eval(
                '#mywithdraw > div.modal-dialog.modal-dialog-scrollable > div > div.modal-body.lst-pop.pt-0 > div:nth-child(7) > div > span',
                (el) => el.innerText
            );
            toThrow = true;
            throw new Error(innerText);
        } catch (err) {
            if (toThrow)
                throw err;
        }

        await page.waitForFunction(() => !!document.querySelector('#mpassword'));
        await page.focus('#mpassword');
        await page.keyboard.type(masterPass);
        await page.keyboard.press('Enter');

        await page.waitForFunction(() => !!document.querySelector('div[role="alert"] > div:nth-child(2)'), { timeout: TINY })
        let message = await page.evaluate(() => document.querySelector('div[role="alert"] > div:nth-child(2)').innerText);

        return {
            success: message.includes('successfully!') && !message.includes('not'),
            message: message
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
