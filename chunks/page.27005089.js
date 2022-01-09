/**
 * Module to identify common browsers, operating systems
 * and hardware devices.
 *
 * Apple hardware detection based very heavily
 * on Alexandre Dieulot's iDevice,
 * which is released under the MIT license.
 * https://github.com/dieulot/idevice
 *
 * For iOS 12.2 and later GPU detection, this module relies
 * on Renderer (getRenderer), released under MPL v2.
 * https://github.com/51degrees/renderer
 *
 */
const userAgent =  window.navigator.userAgent ;
const cache = {};

const commonOperatingSystems = [
  ['iOS', /iP(hone|od|ad)/i],
  ['Android', /Android/i],
  ['BlackBerry OS', /BlackBerry|BB10/i],
  ['Windows Mobile', /IEMobile/i],
  ['Fire OS', /Kindle Fire|Silk|(?:Android|Linux).+KF[A-Z]{2,}/i],
  ['Amazon OS', /Kindle/i],
  ['Windows 3.11', /Win16/i],
  ['Windows 95', /(Windows 95)|(Win95)|(Windows_95)/i],
  ['Windows 98', /(Windows 98)|(Win98)/i],
  ['Windows 2000', /(Windows NT 5.0)|(Windows 2000)/i],
  ['Windows XP', /(Windows NT 5.1)|(Windows XP)/i],
  ['Windows Server 2003', /(Windows NT 5.2)/i],
  ['Windows Vista', /(Windows NT 6.0)/i],
  ['Windows 7', /(Windows NT 6.1)/i],
  ['Windows 8', /(Windows NT 6.2)/i],
  ['Windows 8.1', /(Windows NT 6.3)/i],
  ['Windows 10', /(Windows NT 10.0)/i],
  ['Windows ME', /Windows ME/i],
  ['Open BSD', /OpenBSD/i],
  ['Free BSD', /FreeBSD/i],
  ['Sun OS', /SunOS/i],
  ['Chrome OS', /CrOS/i],
  ['webOS', /webOS/i],
  ['Linux', /(Linux)|(X11)/i],
  ['Mac OS', /(Mac_PowerPC)|(Macintosh)/i],
];

const androidVersions = [
  ['Legacy', /android ([2,3])/i],
  ['Ice Cream Sandwich', /android (4.0)/i],
  ['Jellybean', /android (4.[1|2|3])/i],
  ['KitKat', /android (4.4)/i],
  ['Lollipop', /android (5)/i],
  ['Marshmallow', /android (6)/i],
  ['Nougat', /android (7.[0,1])/i],
  ['Oreo', /android (8.[0,1])/i],
  ['Pie', /android (9)/i],
  ['Q', /android (10)/i]
];

const operatingSystemVersions = {
  android: function(){
    let version = '';
    const {string:releaseName, match:releaseMatch} = testUserAgent(androidVersions);
    if(releaseName){
      version = releaseName;
      if(releaseMatch && releaseMatch.length === 2){
        version = `${releaseMatch[1]} (${releaseName})`;
      }
    }
    return version;
  },
  ios: function(){
    // iphone
    // Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1

    // ipad
    // Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1
    const regex = /CPU(?: iPhone)? OS (\d+(?:_\d+)*)/;
    const match = userAgent.match(regex);
    return match && match.length === 2 ? `${match[1].split('_').join('.')}` : '';
  },
  chrome_os: function(){
    // x86
    // Mozilla/5.0 (X11; CrOS x86_64 11895.95.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.125 Safari/537.36

    // arm
    // Mozilla/5.0 (X11; CrOS armv7l 10575.58.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36
    const regex = /\(X11; CrOS (?:x86_\d+|armv7l) ([0-9\.]*)\)/;
    const match = userAgent.match(regex);
    return match && match.length === 2 ? match[1] : '';
  },
  mac_os: function(){
    // chrome and safari
    //Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36
    //Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15

    // firefox
    // Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/61.0

    const regex = /\(Macintosh(?:.)+Mac OS X (10(?:_\d+)+|10+\.\d+)/;
    const match = userAgent.match(regex);

    // chrome / safari have '_' we need to deal with. we can ignore the '.' in ff.
    return match && match.length === 2 ? `${match[1].split('_').join('.')}` : '';
  }
};


function slugify(string){
  return string.toLowerCase().replace(' ', '_');
}

/**
 * Given an array of useragent regexes and a useragent,
 * return the one that matches as both a string and regex match.
 *
 * return {Object/Boolean}
 * @param {Array} list  Array of UserAgent regexes
 * @param {String} ua   UserAgent string
 * @returns {Object} Matched string and regex match
 */
function testUserAgent(list, ua) {
  ua = ua || getUserAgent();
  for (let i = 0; i < list.length; i += 1) {
    const pattern = list[i][1];
    const match = ua.match(pattern);

    if (match !== null) {
      return {
        match,
        string: list[i][0]
      };
    }
  }

  return false;
}


/**
 * Get operating system and version
 *
 * return {Object}
 */
function getOperatingSystem() {
  if (!cache.getOperatingSystem) {
    let { string: name, match } = testUserAgent(commonOperatingSystems);
    name = name || 'unknown';

    // see if we have an os version test available
    const osSlug = slugify(name);
    const osVersionTest = operatingSystemVersions[osSlug];
    let version = osVersionTest ? osVersionTest() : '';

    cache.getOperatingSystem = {
      name,
      version
    };
  }

  return cache.getOperatingSystem;
}

/**
 * Is any major mobile browser
 *
 * return {Boolean}
 */
function isMobile() {
  if (!cache.isMobile) {
    cache.isMobile = isAndroid() || isIos() || isIpadOs() || isKindleFire () || isKindle() || isBlackberry() || isWindowsMobile () || isWebOS();
  }
  return cache.isMobile;
}

/**
 * Is a desktop browser
 * (or a non-detected mobile device)
 *
 * return {Boolean}
 */
function isDesktop() {
  if (!cache.isDesktop) {
    cache.isDesktop = !isMobile();
  }
  return cache.isDesktop;
}

/**
 * Is device running IpadOS? 
 * This is tricky because UA and navigator.platform 
 * report as a MacIntel desktop in iPadOS.
 * 
 * TODO: come up with a more reliable iPadOS detection, as this will 
 * likely fail when MacOS gets touch screens and other mobile-like 
 * capability.
 */
function isIpadOs() {
  if (!cache.isIpadOs) {
    cache.isIpadOs = isMacOs() && (!!navigator.maxTouchPoints && navigator.maxTouchPoints === 5);    
  }
  return cache.isIpadOs;
}

/**
 * Running iOS on iPhone,iPod and iPad
 *
 * return {Boolean}
 */
function isIos() {
  if (!cache.isIos) {
    cache.isIos = /iP(hone|od|ad)/.test(userAgent);
  }
  return cache.isIos;
}

/**
 * Is device an iPhone
 *
 * return {Boolean}
 */
function isIphone() {
  if (!cache.isIphone) {
    cache.isIphone = /iPhone/.test(userAgent);
  }
  return cache.isIphone;
}


/**
 * Does device run any version of Android
 *
 * return {Boolean}
 */
function isAndroid() {
  if (!cache.isAndroid) {
    cache.isAndroid = /Android/.test(userAgent);
  }
  return cache.isAndroid;
}

/**
 * Does device run any version of webOS
 *
 * return {Boolean}
 */
function isWebOS() {
  if (!cache.isWebOS) {
    cache.isWebOS = /webOS/.test(userAgent);
  }
  return cache.isWebOS;
}

/**
 * Is this a Blackberry
 *
 *  return {Boolean}
 */
function isBlackberry() {
  if (!cache.isBlackberry) {
    cache.isBlackberry = /Blackberry|BB10/.test(userAgent);
  }
  return cache.isBlackberry;
}

/**
 * Is an old-school kindle
 *
 * return {Boolean}
 */
function isKindle() {
  if (!cache.isKindle) {
    const {
      name: os
    } = getOperatingSystem();

    cache.isKindle = os.indexOf('Amazon OS') > -1;

  }
  return cache.isKindle;
}

/**
 * Is a Kindle Fire tablet.
 * This likely needs more work. The UA
 * is all over the place.
 *
 * return {Boolean}
 */
function isKindleFire() {
  if (!cache.isKindleFire) {
    const {
      name: os
    } = getOperatingSystem();
    cache.isKindleFire = os.indexOf('Fire OS') > -1;

  }
  return cache.isKindleFire;
}

/**
 * Does device run Windows Mobile
 *
 *  return {Boolean}
 */
function isWindowsMobile() {
  if (!cache.isWindowsMobile) {
    cache.isWindowsMobile = /IEMobile/.test(userAgent);
  }
  return cache.isWindowsMobile;
}

/**
 * Does device run any version of MacOS
 *
 * return {Boolean}
 */
function isMacOs() {
  if (!cache.isMacOs) {
    const {
      name: os
    } = getOperatingSystem();
    cache.isMacOs = os.indexOf('Mac') > -1;
  }
  return cache.isMacOs;
}

/**
 * Get userAgent string
 *
 * return {String}
 */
function getUserAgent() {
  return userAgent;
}

/**
 * Underscore's debounce:
 * http://underscorejs.org/#debounce
 */
const debounce = function(func, wait, immediate) {
  var result;
  var timeout = null;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
    }
    return result;
  };
};

const classNamePrefixes = {
  env: 'g-page',
  breakpoint: 'g-viewport'
};

const breakpoints = {
  xxsmall: 320,
  xsmall: 480,
  small: 600,
  medium: 740,
  large: 1024,
  xlarge: 1150,
  xxlarge: 1440
};

// const ratioLimits = {
// 	landscape: 1.26,
// 	portrait: 1.15
// };

const userAgent$1 = getUserAgent();

let debug = false;

const html = document.documentElement;

// Environment
// -----------------------
const isApp = () => !!(
  window.location.href.indexOf('app.html') > 0 ||
  window.location.search.indexOf('nytapp') > -1 || // sometimes this query param is present
  userAgent$1.match(/nyt[-_]?(?:ios|android)/i) || // usually the user agent is set
  (userAgent$1.match(/android/i) && window.__HYBRID__) // on hybrid articles in android, the user agent and qs is missing
);

const getEnvironment = () => {
  if (location.hostname.indexOf('localhost') > -1) {
    return 'development';
  }

  if (location.hostname === 'preview.nyt.net') {
    return 'preview';
  }

  return 'production';
};

const getState = () => ({
  isApp: isApp(),
  isIos: isIos(),
  isAndroid: isAndroid(),
  isIphone: isIphone(),
  isMobile: isMobile(),
  isDesktop: isDesktop(),
  isLandscape: isLandscape(),
  isPortrait: isPortrait(),
  isWideScreen: isWideScreen(),
  isSmallScreen: isSmallScreen(),
  isLargeScreen: isLargeScreen(),
  isHighDensity: isHighDensity(),
  isRetina: isRetina()
});

/**
 * Return an array of breakpoint names, width and active status
 *
 * [{name: 'xxsmall', width: '320', active: true}, {}]
 */
const getBreakpoints = () => {
  const vw = getViewport().width;

  return Object.keys(breakpoints).map(name => {
    const width = breakpoints[name];

    return {
      width,
      name,
      active: vw >= width
    };
  });
};

/**
 * Maintain classes on the html element that reflect the
 * current state of all the isSomething functions
 *
 * For example: isMobile() -> html.g-env-ismobile
 * @param {*} debug
 */
const prepEnvironment = (_debug) => {
  _debug = _debug || debug;

  // update cached viewport values
  setViewport();

  getBreakpoints().forEach((breakpoint) => {
    // g-viewport-xxsmall, etc
    const className = `${classNamePrefixes.breakpoint}-${breakpoint.name}`;

    if (breakpoint.active) {
      html.classList.add(className);
    } else {
      html.classList.remove(className);
    }

    if (_debug) {
      console.log(breakpoint.name, breakpoint.active);
    }
  });

  // run all test and record their true/false state.
  // ex: isMobile() -> g-env-ismobile
  const testResults = getState();
  Object.keys(testResults).forEach((fnName) => {
    // isMobile to g-env-ismobile
    const className = `${classNamePrefixes.env}-${fnName.toLowerCase()}`;
    const result = testResults[fnName];

    // add or remove html class based on result of test
    if (result) {
      html.classList.add(className);
    } else {
      html.classList.remove(className);
    }

    if (_debug) {
      console.log(fnName, result);
    }
  });
};

// Resolution
// -----------------------

const pixelRatio = () => window.devicePixelRatio || 1.0;

const isHighDensity = () => (
  (window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) ||
  (pixelRatio() > 1.3)
);

// http://stackoverflow.com/questions/19689715/what-is-the-best-way-to-detect-retina-support-on-a-device-using-javascript
const isRetina = () => ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)').matches ||
window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)').matches)) ||
(pixelRatio() >= 2)) && /(iPad|iPhone|iPod)/g.test(userAgent$1);


// Viewport, Aspect & Orientation
// -----------------------

let cachedViewport;

const setViewport = () => {
  const width = Math.max(html.clientWidth, window.innerWidth);
  const height = Math.max(html.clientHeight, window.innerHeight);
  const aspectRatio = width / height;
  cachedViewport = { width, height, aspectRatio };
};

const getViewport = () => {
  if (!cachedViewport) {
    setViewport();
  }

  return cachedViewport;
};

const getAspectRatio = () => getViewport().aspectRatio;
const isLandscape = () => getAspectRatio() > 1;
const isPortrait = () => !isLandscape();
const isWideScreen = () => getAspectRatio() > (breakpoints.xxlarge / 1029);


// Size
// -----------------------

const isSmallScreen = () => getViewport().width <= breakpoints.medium;
const isLargeScreen = () => getViewport().width >= breakpoints.xlarge;



// START APP
// ---------------------


html.classList.add(`${classNamePrefixes.env}-${getEnvironment()}`);


const debouncedPrepEnvironment = debounce(prepEnvironment, 250);
window.addEventListener('resize', () => { debouncedPrepEnvironment(); });
prepEnvironment();

export { getViewport as g, isMobile as i };
//# sourceMappingURL=page.27005089.js.map
