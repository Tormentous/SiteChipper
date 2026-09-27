extends Node3D
## Miiverse-style Coolbrador recommended feed for BeeSid lair (test hook).
## On level start: fetch (or use embedded) posts, shuffle, print 5 with media.

const FEED_URL := "https://coolbrador.web.app/data/chipper-miiverse.json"
const PICK_COUNT := 5

## Offline / pre-deploy fallback pool (same vibe as site JSON).
var _fallback: Array = [
	{"username": "BeeSid", "text": "drew my lair but the shipping containers keep eating my crayon", "media": "crayon lair map", "media_url": "/shared/TestImages/Checkpoint.jpg"},
	{"username": "GyattToad", "text": "if you hear buzzing, do NOT make friends. i made friends", "media": "do not pass", "media_url": "/shared/TestImages/Cannot%20Pass.jpg"},
	{"username": "Cardbrador", "text": "stock chart went UP so i jumped UP. physics disagreed", "media": "portfolio tears", "media_url": "/shared/TestImages/Broke%20and%20Poor.jpg"},
	{"username": "Miguel", "text": "selfie with Metal Lab before he noticed", "media": "brave selfie", "media_url": "/shared/TestImages/Eat%20Slop.jpg"},
	{"username": "CoolDog", "text": "fan knocked me into another fan. performance art", "media": "fan ballet", "media_url": "/shared/TestImages/Dancing.mp4"},
	{"username": "NerdDog", "text": "hypothesis: bees are spicy floating dogs", "media": "science board", "media_url": "/shared/TestImages/Electricity.jpg"},
	{"username": "AnthonySpade", "text": "trap door said FREE SNACKS. it was spikes", "media": "spicy snacks", "media_url": "/shared/TestImages/Fake%20Friends.jpg"},
	{"username": "BeeSid", "text": "buy high, buzz higher. this is bee advice", "media": "bee tips", "media_url": "/shared/TestImages/World%20Leaders.jpg"},
	{"username": "Hamlet", "text": "your ceiling is my floor. stop stomping", "media": "pig mail", "media_url": "/shared/TestImages/Checkpoint.jpg"},
	{"username": "GyattToad", "text": "speedrun interrupted by a squirrel with a briefcase", "media": "squirrel counsel", "media_url": "/shared/TestImages/Cat%20Massage.mp4"},
	{"username": "Cardbrador", "text": "drew Chipper as a Miiverse stamp. collect them all (there is one)", "media": "stamp art", "media_url": "/shared/TestImages/Propaganda.jpg"},
	{"username": "CoolDog", "text": "balloon cart stole my lunch. respect the hustle", "media": "lunch theft", "media_url": "/shared/TestImages/Broke%20and%20Poor.jpg"},
]

func _ready() -> void:
	randomize()
	print("[CoolbradorFeed] BeeSid lair boot — loading recommended Miiverse posts…")
	_load_and_print()

func _load_and_print() -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(_on_feed_http.bind(http))
	var err := http.request(FEED_URL)
	if err != OK:
		push_warning("[CoolbradorFeed] HTTPRequest failed to start (%s); using offline pool" % err)
		_print_picks(_fallback.duplicate())
		http.queue_free()

func _on_feed_http(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray, http: HTTPRequest) -> void:
	var pool: Array = _fallback.duplicate()
	if result == HTTPRequest.RESULT_SUCCESS and response_code >= 200 and response_code < 300:
		var parsed = JSON.parse_string(body.get_string_from_utf8())
		if typeof(parsed) == TYPE_DICTIONARY and parsed.has("posts"):
			pool = []
			for p in parsed["posts"]:
				if typeof(p) != TYPE_DICTIONARY:
					continue
				var media = p.get("media", {})
				var label := ""
				var url := ""
				if typeof(media) == TYPE_DICTIONARY:
					label = str(media.get("label", media.get("type", "media")))
					url = str(media.get("url", ""))
				pool.append({
					"username": str(p.get("username", "Lab")),
					"text": str(p.get("text", "")),
					"media": label,
					"media_url": url,
					"id": str(p.get("id", "")),
				})
			print("[CoolbradorFeed] fetched %s posts from Coolbrador" % pool.size())
		else:
			push_warning("[CoolbradorFeed] bad JSON; offline pool")
	else:
		push_warning("[CoolbradorFeed] fetch failed result=%s code=%s; offline pool" % [result, response_code])
	_print_picks(pool)
	http.queue_free()

func _print_picks(pool: Array) -> void:
	pool.shuffle()
	var n: int = mini(PICK_COUNT, pool.size())
	print("========== Coolbrador × Chipper · %s recommended posts ==========" % n)
	print("(Chipper Game Board · BeeSid · randomized each run)")
	for i in range(n):
		var p: Dictionary = pool[i]
		print("--- #%s / %s ---" % [i + 1, n])
		print("  @%s" % p.get("username", "?"))
		print("  %s" % p.get("text", ""))
		print("  media: %s" % p.get("media", "(none)"))
		if str(p.get("media_url", "")) != "":
			print("  media_url: %s" % p.get("media_url"))
	print("================================================================")
