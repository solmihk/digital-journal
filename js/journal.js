(function () {
  // ─── Clock ───
  var clockEl = document.getElementById('navClock');
  function updateClock() {
    var now = new Date();
    var pst = now.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    var isDST = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' }).includes('PDT');
    clockEl.textContent = pst + ' ' + (isDST ? 'PDT' : 'PST');
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ─── Book state ───
  var pages = Array.from(document.querySelectorAll('.fan-page'));
  var total = pages.length;
  var currentPage = 0;
  var isAnimating = false;
  var pageNumEl = document.getElementById('pageNum');

  var RIGHT_MIN = 5;
  var RIGHT_MAX = 82;
  var LEFT_MIN = -82;
  var LEFT_MAX = -5;

  function layoutPages() {
    var leftCount = currentPage;
    var rightCount = total - currentPage;

    pages.forEach(function (page, i) {
      var angle, z;

      if (i < currentPage) {
        // Flipped pages: left side, past -90° so back face shows
        if (leftCount === 1) {
          angle = (LEFT_MIN + LEFT_MAX) / 2 - 90;
        } else {
          var t = i / (leftCount - 1);
          angle = LEFT_MIN - 90 + t * (LEFT_MAX - LEFT_MIN);
        }
        z = i + 1;
      } else {
        // Unflipped pages: right side, 0°–90° so front face shows
        if (rightCount === 1) {
          angle = (RIGHT_MIN + RIGHT_MAX) / 2;
        } else {
          var j = i - currentPage;
          var t2 = j / (rightCount - 1);
          angle = RIGHT_MIN + t2 * (RIGHT_MAX - RIGHT_MIN);
        }
        z = total - (i - currentPage);
      }

      page.style.transform = 'rotateY(' + angle + 'deg)';
      page.style.zIndex = z;
    });
  }

  function updatePageNum() {
    pageNumEl.textContent = currentPage + ' / ' + total;
  }

  function flipForward() {
    if (currentPage >= total || isAnimating) return;
    isAnimating = true;

    var page = pages[currentPage];
    page.style.zIndex = total * 2 + 1;
    page.style.transition = 'transform 0.9s cubic-bezier(0.645, 0.045, 0.355, 1.0)';

    var targetAngle;
    var newLeftCount = currentPage + 1;
    if (newLeftCount === 1) {
      targetAngle = (LEFT_MIN + LEFT_MAX) / 2 - 90;
    } else {
      var t = currentPage / (newLeftCount - 1);
      targetAngle = LEFT_MIN - 90 + t * (LEFT_MAX - LEFT_MIN);
    }

    page.style.transform = 'rotateY(' + targetAngle + 'deg)';
    currentPage++;
    updatePageNum();
  }

  function flipBackward() {
    if (currentPage <= 0 || isAnimating) return;
    isAnimating = true;

    currentPage--;
    var page = pages[currentPage];
    page.style.zIndex = total * 2 + 1;
    page.style.transition = 'transform 0.9s cubic-bezier(0.645, 0.045, 0.355, 1.0)';

    var targetAngle;
    var newRightCount = total - currentPage;
    if (newRightCount === 1) {
      targetAngle = (RIGHT_MIN + RIGHT_MAX) / 2;
    } else {
      var j = 0;
      var t = j / (newRightCount - 1);
      targetAngle = RIGHT_MIN + t * (RIGHT_MAX - RIGHT_MIN);
    }

    page.style.transform = 'rotateY(' + targetAngle + 'deg)';
    updatePageNum();
  }

  // Transition end: settle all pages into final fan positions
  pages.forEach(function (page) {
    page.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'transform') {
        isAnimating = false;
        layoutPages();
      }
    });
  });

  // ─── Click zones ───
  document.getElementById('flipRight').addEventListener('click', function () {
    flipForward();
  });

  document.getElementById('flipLeft').addEventListener('click', function () {
    flipBackward();
  });

  // ─── Click individual pages ───
  pages.forEach(function (page) {
    page.addEventListener('click', function (e) {
      e.stopPropagation();
      var idx = parseInt(page.getAttribute('data-index'));

      if (idx >= currentPage) {
        flipForward();
      } else {
        flipBackward();
      }
    });
  });

  // ─── Keyboard ───
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      flipForward();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      flipBackward();
    }
  });

  // ─── Trackpad / scroll wheel swipe ───
  var heroEl = document.querySelector('.hero');
  var swipeDelta = 0;
  var SWIPE_THRESHOLD = 50;

  heroEl.addEventListener('wheel', function (e) {
    e.preventDefault();
    swipeDelta += e.deltaX;

    if (swipeDelta > SWIPE_THRESHOLD) {
      flipForward();
      swipeDelta = 0;
    } else if (swipeDelta < -SWIPE_THRESHOLD) {
      flipBackward();
      swipeDelta = 0;
    }
  }, { passive: false });

  // ─── Mouse parallax on book ───
  var bookEl = document.getElementById('book3d');

  heroEl.addEventListener('mousemove', function (e) {
    if (isAnimating) return;
    var rect = heroEl.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    var y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    bookEl.style.transform = 'rotateY(' + (x * 4) + 'deg) rotateX(' + (-y * 3) + 'deg)';
  });

  heroEl.addEventListener('mouseleave', function () {
    bookEl.style.transform = 'rotateY(0deg) rotateX(0deg)';
  });

  // ─── Scroll prompt ───
  var scrollPrompt = document.querySelector('.scroll-prompt');
  if (scrollPrompt) {
    scrollPrompt.style.cursor = 'pointer';
    scrollPrompt.addEventListener('click', function () {
      var s = document.getElementById('section-1');
      if (s) s.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ─── Init ───
  layoutPages();
  updatePageNum();
})();
