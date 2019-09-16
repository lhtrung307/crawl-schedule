const cheerio = require('cheerio');
const shell = require('shelljs');
const axios = require('axios').default;
const { Builder, until, By, Key } = require('selenium-webdriver');

const startSeleniumHub = 'docker run -d --name selenium-hub -p 4444:4444 selenium/hub';
const startSeleniumFireFox = 'docker run -d -P --link selenium-hub:hub selenium/node-firefox';

const url = 'http://uis.ptithcm.edu.vn/';
const allScheduleUrl = 'http://uis.ptithcm.edu.vn/Default.aspx?page=thoikhoabieu&load=all';
const scheduleUrl = 'http://uis.ptithcm.edu.vn/default.aspx?page=nhapmasv&flag=ThoiKhoaBieu';

const restartDockerContainer = async () => {
  return new Promise((resolve, reject) => {
    shell.exec('docker restart d7c69fd99eb7d27bed968abbd558f236e9921e2df1ca4f39a286da9fc5b4f415', function(
      code,
      stdout,
      stderr
    ) {
      console.log('Exit code:', code);
      if (code === 0) {
        shell.exec('docker restart 36c5f39ee0532112b9a91cee8471403afc615e1653abc798e9bcaa82bb5bbfcb', function(
          code,
          stdout,
          stderr
        ) {
          console.log('Exit code:', code);
          if (code === 0) {
            setTimeout(() => resolve('Done'), 2000);
          } else {
            reject('Error');
          }
          console.log('Program output:', stdout);
          console.log('Program stderr:', stderr);
        });
      }
      console.log('Program output:', stdout);
      console.log('Program stderr:', stderr);
    });
  });
  // if (docker1.code !== 0 && docker2.code !== 0) {
  //   console.log('Cannot restart docker image, please retry');
  // } else {
  //   console.log('Restart docker container');
  // }
};

const chooseTypeOfSchedule = async driver => {
  const typeOfSchedule = 'ctl00_ContentPlaceHolder1_ctl00_ddlChon';
  const selectTypeOfSchedule = await driver.findElement(By.id(typeOfSchedule));
  await selectTypeOfSchedule.click();
  const options = await selectTypeOfSchedule.findElements(By.tagName('option'));
  if (!options && options.length === 0) {
    throw new Error('Types of schedule are not exist');
  }
  await options[2].click();
};

const chooseClassOfSchedule = async driver => {
  const selectClassID = 'ctl00_ContentPlaceHolder1_ctl00_ddlHienThiKQ';
  const selectClassOfSchedule = await driver.findElement(By.id(selectClassID));
  await selectClassOfSchedule.click();
  const classes = await selectClassOfSchedule.findElements(By.tagName('option'));
  if (!classes && classes.length === 0) {
    throw new Error('Classes are not exist');
  }
  await classes[2].click();
};

const clickFilterBtn = async driver => {
  const filterScheduleBtnID = 'ctl00_ContentPlaceHolder1_ctl00_bntLocTKB';
  const filterScheduleBtn = await driver.findElement(By.id(filterScheduleBtnID));
  await filterScheduleBtn.click();
};

const getSchedulePage = async () => {
  let driver = null;
  try {
    driver = await new Builder()
      .forBrowser('firefox')
      .usingServer(process.env.SELENIUM_REMOTE_URL || 'http://localhost:4444/wd/hub')
      .build();
    await driver.get(allScheduleUrl);
    // await driver.manage().setTimeouts(10000);
    await driver.wait(
      until.titleIs('Cổng Thông Tin Đào Tạo-CƠ SỞ TẠI TP.HỒ CHÍ MINH (version ktuyen: 2019.08.15)', 1000)
    );
    await chooseTypeOfSchedule(driver);
    await chooseClassOfSchedule(driver);
    await clickFilterBtn(driver);
    const source = await driver.getPageSource();
    const $ = cheerio.load(source);
    const text = $('#ctl00_ContentPlaceHolder1_ctl00_lblMaMH').text();
    console.log('text :', text);
    return text;
  } catch (error) {
    console.log('error :', error);
  } finally {
    await driver.quit();
  }
};

const chooseUserSchedule = async driver => {
  const studentIDradioBtnID = 'ctl00_ContentPlaceHolder1_ctl00_radioMaSV';
  const studentIDradioBtn = await driver.findElement(By.id(studentIDradioBtnID));
  await studentIDradioBtn.click();
};

const fillInStudentID = async (driver, studentID) => {
  const studentIDField = 'ctl00_ContentPlaceHolder1_ctl00_txtMaSV';
  const studentIDtext = await driver.findElement(By.id(studentIDField));
  studentIDtext.sendKeys(studentID);
};

const goToSchedulePage = async driver => {
  const okBtnID = 'ctl00_ContentPlaceHolder1_ctl00_btnOK';
  const okBtn = await driver.findElement(By.id(okBtnID));
  okBtn.click();
};

const waitTilFinishedLoadPage = async driver => {
  await driver.wait(
    until.titleIs('Cổng Thông Tin Đào Tạo-CƠ SỞ TẠI TP.HỒ CHÍ MINH (version ktuyen: 2019.08.15)', 1000)
  );
};

const getScheduleOfUser = async studentID => {
  let driver = null;
  try {
    driver = await new Builder()
      .forBrowser('firefox')
      .usingServer(process.env.SELENIUM_REMOTE_URL || 'http://localhost:4444/wd/hub')
      .build();
    await driver.get(scheduleUrl);
    await waitTilFinishedLoadPage(driver);
    await chooseUserSchedule(driver);
    await waitTilFinishedLoadPage(driver);
    await fillInStudentID(driver, studentID);
    await goToSchedulePage(driver);
    await driver.wait(
      until.titleIs('Cổng Thông Tin Đào Tạo-CƠ SỞ TẠI TP.HỒ CHÍ MINH (version ktuyen: 2019.08.15)', 1000)
    );
    const source = await driver.getPageSource();
    const $ = cheerio.load(source);
    const text = $('#ctl00_ContentPlaceHolder1_ctl00_Table1').html();
    console.log('text :', text);
  } catch (error) {
  } finally {
    await driver.quit();
  }
};

const crawlClassSchedule = async () => {
  await restartDockerContainer();
  return await getSchedulePage();
};

module.exports.crawlClassSchedule = crawlClassSchedule;
