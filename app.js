const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = 'F8_PLAYER'

 //gọi ra các biến bên HTML (play/pause...)
    const player = $(".player");
    const heading = $('header h2');
    const cdThumb = $('.cd-thumb');
    const audio = $('#audio');
    const playlist = $(".playlist");

//bắt sự kiện play/pause:
const playBtn = $(".btn-toggle-play"); 
  
//lấy ra elemnet của cd(HTML)
const cd = $('.cd');
//lấy ra element của progress(HTML) thanh chạy dưới play/pause:
const progress = $("#progress");
//lấy ra element Next/Prev (HTML):
const prevBtn = $(".btn-prev");
const nextBtn = $(".btn-next");
//lấy ra elemnet của radom(HTML)
const randomBtn = $(".btn-random");
//lấy ra elemnet của repeat(HTML)
const repeatBtn = $(".btn-repeat");

const app = {
  currentIndex: 0, //lấy ra chỉ mục đầu tiên của mảng
  isPlaying: false, //mặc định là false
  isRandom: false, //random bài hát
  isRepeat: false, //repeat bài hát
  config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
  songs: [
    {
      name: "Có chơi có chịu",
      singer: "Karik & OnlyC",
      path: "./assets/music/bai1.mp3",
      image: "./assets/img/bai1.jpg",
    },

    {
      name: "Waitting for you",
      singer: "Mono",
      path: "./assets/music/bai2.mp3",
      image: "./assets/img/bai2.jpg",
    },
    {
      name: "Bên trên tầng lầu",
      singer: "Tăng duy tân",
      path: "./assets/music/bai3.mp3",
      image: "./assets/img/bai3.jpg",
    },
    {
      name: "Thêm bao nhiêu lâu",
      singer: "Đạt G",
      path: "./assets/music/bai4.mp3",
      image: "./assets/img/bai4.jpg",
    },
    {
      name: "Phải làm sao để níu kéo một người",
      singer: "Sean & Tweny",
      path: "./assets/music/bai5.mp3",
      image: "./assets/img/bai5.jpg",
    },
  ],
  setConfig: function (key, value) {
    this.config[key] = value;
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
  },

  render: function () {
    const htmls = this.songs.map((song, index) => {
      return `
       <div class="song ${
         index === this.currentIndex ? "active" : ""
       }" data-index="${index}">
      <div class="thumb" style="background-image: url('${song.image}')">
      </div>
      <div class="body">
        <h3 class="title">${song.name}</h3>
        <p class="author">${song.singer}</p>
      </div>
      <div class="option">
        <i class="fas fa-ellipsis-h"></i>
      </div>
    </div>
      `;
    });
    playlist.innerHTML = htmls.join("");
  },

  //định nghĩa ra những thuộc tính cho object:
  defineProperties: function () {
    Object.defineProperty(this, "currentSong", {
      get: function () {
        return this.songs[this.currentIndex];
      },
    });
  },

  //Xử lý sự kiện (DOM)
  handleEvents: function () {
    //đặt biến khi play audio
    const _this = this;
    //kích thước chiều ngang hiện tại
    const cdWidth = cd.offsetWidth;

    //xử lý CD rotate(quay tròn và dừng)
    const cdThumbAnimate = cdThumb.animate([{ transform: "rotate(360deg)" }], {
      duration: 10000, //10 giây
      interactions: Infinity, //quay vô hạn
    });
    cdThumbAnimate.pause();

    //lắng nghe sự kiện kéo lên xuống list bài hát (Onsscroll)
    document.onscroll = function () {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      const newCdWidth = cdWidth - scrollTop;

      cd.style.width = newCdWidth > 0 ? newCdWidth + "px" : 0;
      cd.style.opacity = newCdWidth / cdWidth;
    };
    //xử lý khi click play:
    playBtn.onclick = function () {
      if (app.isPlaying) {
        audio.pause();
        cdThumbAnimate.pause();
      } else {
        audio.play();
        cdThumbAnimate.play();
      }
    };
    //khi song được play
    audio.onplay = function () {
      _this.isPlaying = true;
      player.classList.add("playing");
    };
    //khi song bị pause
    audio.onpause = function () {
      _this.isPlaying = false;
      player.classList.remove("playing");
    };
    //khi tiến độ bài hát thay đổi (thanh chạy dưới play/pause)
    audio.ontimeupdate = function () {
      if (audio.duration) {
        const progressPercent = Math.floor(
          (audio.currentTime / audio.duration) * 100
        );
        progress.value = progressPercent;
      }
    };
    //xử lý (tua) song
    progress.oninput = function (e) {
      const seekTime = (audio.duration / 100) * e.target.value;
      audio.currentTime = seekTime;
    };
    //khi next bài hát:
    nextBtn.onclick = function () {
      if (_this.isRandom) {
        _this.playRandomSong();
      } else {
        _this.nextSong();
      }
      audio.play();
      _this.render();
      _this.scrollToActiveSong();
    };
    //khi Prev bài hát:
    prevBtn.onclick = function () {
      if (_this.isRandom) {
        _this.playRandomSong();
      } else {
        _this.prevSong();
      }
      audio.play();
      _this.render();
      _this.scrollToActiveSong();
    };
    //xử lý bật / tắt random song:
    randomBtn.onclick = function () {
      _this.isRandom = !_this.isRandom;
      _this.setConfig('isRandom', _this.isRandom);
      randomBtn.classList.toggle("active", _this.isRandom);
    };
    //xử lý lặp lại 1 song:
    repeatBtn.onclick = function () {
      _this.isRepeat = !_this.isRepeat;
      _this.setConfig("isRepeat", _this.isRepeat);

      repeatBtn.classList.toggle("active", _this.isRepeat);
    };
    //xử lý next song khi audio ended:
    audio.onended = function () {
      if (_this.isRepeat) {
        audio.play();
      } else {
        nextBtn.click();
      }
    };

    //lắng nghe click hành vi vào playlist:
    playlist.onclick = function (e) {
      const songNode = e.target.closest(".song:not(.active)");
      if (songNode || e.target.closest(".option")) {
        //xử lý khi click vào song:
        if (songNode) {
          _this.currentIndex = Number(songNode.dataset.index);
          _this.loadCurrentSong();
          _this.render();
          audio.play();
        }

        //xử lý khi click vào song option:
        if (e.target.closest(".option")) {
        }
      }
    };
  },
  //next bài hát thì thanh list nhạc scroll tự nhảy theo (active)
  scrollToActiveSong: function () {
    setTimeout(function () {
      $(".song.active").scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }, 300);
  },

  //tải ra bài hát đầu tiên
  loadCurrentSong: function () {
    //xử lý heading/cdThumb/audio:
    heading.textContent = this.currentSong.name;
    cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
    audio.src = this.currentSong.path;
  },

  //load config:
  loadConfig: function () {
    this.isRandom = this.config.isRandom;
    this.isRepeat = this.config.isRepeat;

    // Object.assign(this, this.config); cách 2

    //hiển thị trạng thái ban đầu của button repeat và random:
    randomBtn.classList.toggle("active", this.isRandom);
    repeatBtn.classList.toggle("active", this.isRepeat);
  },
  //Next bài hát:
  nextSong: function () {
    this.currentIndex++;
    if (this.currentIndex >= this.songs.length) {
      this.currentIndex = 0;
    }
    this.loadCurrentSong();
  },
  //Prev bài hát:
  prevSong: function () {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.songs.length - 1;
    }
    this.loadCurrentSong();
  },

  //random bài hát:
  playRandomSong: function () {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } while (newIndex === this.currentIndex);
    this.currentIndex = newIndex;
    this.loadCurrentSong();
  },

  start: function () {
    //gán cấu hình từ config vào oứng dụng
    this.loadConfig();

    //định nghĩa các thuộc tính cho object
    this.defineProperties();

    //lắng nghe xử lý các sự kiện(DOM event)
    this.handleEvents();

    // tải thông tin bài hát đầu tiên  vào UI khi chạy ứng dụng
    this.loadCurrentSong();

    //render lại Playlist
    this.render();

  },
};

app.start();
