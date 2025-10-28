# lrcsync (wip)
<img href="https://lrcsync.iamas.ink" title="temporary?? favicon :3" src="./static/favicon.svg" alt="cat playing saxophone logo" width="100"/>  
  
open [lrcsync.iamas.ink](https://lrcsync.iamas.ink)  

advanced lrc editor with waveform timeline (using [wavesurfer](https://wavesurfer.xyz/))  

## todo
- [ ] better readme :)
- [ ] clean existing timestamps button

- [ ] on drag audio in, and there is already lyrics, prompt to clear current lyrics and metadata

- [ ] toggle autocentre or whatever its called
- [ ] fix weird line index stuff when before first lyric

- [ ] support multiple timestamps?  ( eg "[00:01.10][00:10.00] lyric")
- [ ] support karaoke?  ( eg "[00:01.10] <00:01.15> lyric <00:01.95> lyric2")
- [ ] support comments?

- [ ] save cookies for 
  - [x] settings, 
  - [ ] current lyrics 
  - [ ] etc.

- [ ] undo/redo

- [ ] tauri:
  - [ ] filetype association and loading?
  - [ ] test

- [ ] improve handling of blank lines (no lyric, no time). generally should be ignored, but kept.
 - [ ] warnings check
 - [x] break countdown
 - [ ] etc
 - [x] swap order of blanks so timed comes first: [-1] blank, [timed] blank -> [timed] blank, [-1] blank 

- [ ] fix loading jank
- [ ] speed up loading and stuff


- [ ] lrclib integration?
  - [ ] check if theres valid lyrics, compare them?


- [ ] custom romanization & different scripts
  - [ ] user can add romanized version and itll map to current lyrics?
  - [ ] loading multiple lrc files (.Romanized.lrc or something?)
  - [ ] furigana etc?



- [ ] improve mobile



# attribution
favicon/icon uses twemoji
https://github.com/jdecked/twemoji
