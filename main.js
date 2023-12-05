const gestureParam = require("./gestureParam.js");

const package = "com.xiaomi.vipaccount";
const deviceHeight = 2400;
const deviceWidth = 1080;

auto.waitFor();

function unlockScreen() {
  while (!device.isScreenOn()) {
    device.wakeUp();
    sleep(1000);
  }

  toastLog("开始滑动解锁");
  let times = 3;
  while (times--) {
    swipe(
      deviceWidth / 2,
      (deviceHeight / 4) * 3,
      deviceWidth / 2,
      deviceHeight / 4,
      1000
    );
    sleep(2000); // 等待动画
  }

  toastLog("开始手势解锁");
  // gestureParam 解锁的坐标和时间
  gestures(gestureParam);
}

function isLocked() {
  return context
    .getSystemService(context.KEYGUARD_SERVICE)
    .inKeyguardRestrictedInputMode();
}

function checkIn() {
  // 切换到我的
  while (!id("nav_item_3").exists()) sleep(1);
  id("nav_item_3").findOne().click();

  while (!text("每日签到").exists()) sleep(1);
  click("每日签到");

  while (!(text("已签到").exists() || text("立即签到").exists())) sleep(1);

  if (text("已签到").exists()) {
    toastLog("已签到，不再签到");
  } else {
    // 不延迟签到可能报错
    sleep(2000);
    // 会卡在人机验证，需要手动操作
    // click("立即签到");
    while (!text("已签到").exists()) sleep(1000);
    // 手动检查结果的时间
    sleep(3 * 1000);
    toastLog("签到成功");
  }
}

function viewPost() {
  let firstPostText;
  toastLog("开始查找第 1 个非视频帖子");
  while (true) {
    let firstPostChild;
    let counter;
    for (counter = 0; counter < 10; counter++) {
      try {
        firstPostChild = id(`${package}:id/content_view`)
          .depth(15)
          .find()
          .filter(function (ui) {
            return ui.bounds().width() > 0; // 存在相同 id 的情况，所以要排除
          })[0]
          .child(1) // 屏幕第 1 个帖子 (LinearLayout)
          .children();
        break;
      } catch (error) {
        if (id("single_banner").exists()) {
          id("close").findOne().click();
          toastLog("已关闭弹窗");
        }
        toastLog(error);
        sleep(2000);
        if (text("重新加载").exists()) {
          click("重新加载");
          toastLog("点击 重新加载");
          sleep(5000);
        }
      }
    }
    if (counter == 10) {
      toastLog("超过最大重试次数，没有找到帖子，结束运行");
      exit();
    }

    // 找到第 1 个非视频帖子，视频帖子不计算积分
    if (
      firstPostChild.length >= 3 &&
      firstPostChild[1].className() == "android.widget.TextView" &&
      firstPostChild[2].className() == "android.view.ViewGroup"
    ) {
      firstPostText = firstPostChild[1];
      break;
    }
    toastLog("向下滑动查找非视频帖子");
    const x = deviceWidth / 2,
      y = (deviceHeight / 4) * 3;
    swipe(x, y, x, y - 500, 500);
  }

  // 点击文字部分进入帖子
  toastLog("点击进入帖子");
  toastLog(firstPostText.text());
  click(firstPostText.bounds().centerX(), firstPostText.bounds().centerY());

  // 浏览和点赞
  toastLog("开始浏览帖子");
  sleep(15000);
  className("android.widget.Button").textStartsWith("点赞").findOne().click();
  sleep(1000);
  back();
  toastLog("浏览和点赞结束");
}

function main() {
  if (isLocked()) {
    toastLog("屏幕已锁");
    unlockScreen();
  } else {
    toastLog("屏幕未锁");
  }

  shell(`am force-stop ${package}`, true);
  sleep(1000);

  launch(package);
  toastLog("等待可能的弹窗广告");
  sleep(10000);
  toastLog("等待完成");
  back();
  sleep(2000);
  toastLog("开始操作");

  viewPost();
  checkIn();

  let result = shell(`am force-stop ${package}`, true);
  toastLog(result);
  // lockScreen();
}

main();
//unlockScreen();
