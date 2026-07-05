export const BAD_EXTENSIONS = new Set([
	// images
	".jpg",
	".jpeg",
	".png",
	".gif",
	".bmp",
	".webp",
	".svg",
	".ico",
	".tiff",
	".psd",
	".heic",
	// info stuff
	".cue",
	".m3u",
	".m3u8",
	".nfo",
	".sfv",
	// archive
	".zip",
	".rar",
	".7z",
	".tar",
	".gz",
	// hidden
	".DS_Store",
	".thumbs.db",
])

export const LYRIC_EXTENSIONS = new Set([".lrc", ".txt"])

export const AUDIO_EXTENSIONS = new Set([".mp3", ".flac", ".opus"])