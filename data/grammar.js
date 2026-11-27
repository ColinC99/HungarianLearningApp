// Grammar drills. Each line makes two cards: produce the form, and recognise what it means.
// "#skill-id L<level> after=a,b | Title | Explanation" starts a skill. A skill only starts appearing
//   once its level is open AND the skills listed in after= are partly mastered.
// "base | english cue | answer | note | wrong / wrong / wrong"
//   base#pos picks a specific word (e.g. hét#n = week). The optional last field holds hand-written
//   wrong options for multiple choice (otherwise they are generated from similar forms).
// A line starting with ">" is produce-only, "<" recognise-only.
export default `
#plural L1 | Plural -k | Add -k for plurals. After a consonant a linking vowel appears: -ok/-ek/-ök, and some words take -ak. Final -a/-e lengthens: alma → almák.
ház | houses | házak | ház takes -ak
autó | cars | autók
alma | apples | almák | -a → -á
kutya | dogs | kutyák
könyv | books | könyvek
gyerek | children | gyerekek
barát | friends | barátok
szék | chairs | székek
asztal | tables | asztalok
virág | flowers | virágok
nap | days | napok
év | years | évek
fiú | boys | fiúk
nő | women | nők
férfi | men | férfiak | férfi takes -ak
ember | people | emberek
madár | birds | madarak | the long á shortens: madar-
ló | horses | lovak | ló → lov-
kő | stones | kövek | kő → köv-
levél | letters | levelek | levél → level-
kéz | hands | kezek | kéz → kez-
szó | words | szavak | szó → szav-
tó | lakes | tavak | tó → tav-
pohár | glasses | poharak | pohár → pohar-
kenyér | loaves (of bread) | kenyerek | kenyér → kenyer-
út | roads | utak | út → ut-
hét#n | weeks | hetek | hét → het-
toll | pens | tollak
tükör | mirrors | tükrök | the ö drops: tükr-
eper | strawberries | eprek | the e drops: epr-
lány | girls | lányok
város | cities | városok
szoba | rooms | szobák
tojás | eggs | tojások
cipő | shoes | cipők
fül | ears | fülek
tanár | teachers | tanárok

#acc L1 | Object -t | The direct object gets -t: Látok egy kutyát. After a consonant a linking vowel often appears (-ot/-et/-öt, some words -at). Final -a/-e lengthens: alma → almát.
kávé | a coffee (as object) | kávét | Kérek egy kávét.
víz | water (as object) | vizet | víz → viz- + -et
kenyér | bread (as object) | kenyeret | kenyér → kenyer- + -et
sör | a beer (as object) | sört
bor | wine (as object) | bort
alma | an apple (as object) | almát | -a → -á
könyv | a book (as object) | könyvet
ház | a house (as object) | házat | ház takes -at
autó | a car (as object) | autót
levél | a letter (as object) | levelet | levél → level-
ló | a horse (as object) | lovat | ló → lov-
madár | a bird (as object) | madarat | madár → madar-
kutya | a dog (as object) | kutyát
gyerek | a child (as object) | gyereket
barát | a friend (as object) | barátot
asztal | a table (as object) | asztalt | after l, r, n, s, sz, z, j the -t often attaches directly
sajt | cheese (as object) | sajtot
tej | milk (as object) | tejet
hús | meat (as object) | húst
hal | fish (as object) | halat | hal takes -at
leves | soup (as object) | levest
pénz | money (as object) | pénzt
jegy | a ticket (as object) | jegyet
szoba | a room (as object) | szobát
tojás | an egg (as object) | tojást
kanál | a spoon (as object) | kanalat | kanál → kanal-
pohár | a glass (as object) | poharat | pohár → pohar-
kéz | a hand (as object) | kezet | kéz → kez-
tó | the lake (as object) | tavat | tó → tav-
kő | a stone (as object) | követ | kő → köv-
név | a name (as object) | nevet | név → nev-
mi#q | what? (as object) | mit | Mit kérsz? = What would you like?
ki | whom? (as object) | kit | Kit vársz? = Who are you waiting for?

#in-ban L1 | -ban/-ben: in | Where? — inside something. Back-vowel words take -ban, front-vowel words -ben. Final -a/-e lengthens: szoba → szobában.
ház | in the house | házban
szoba | in the room | szobában
konyha | in the kitchen | konyhában
bolt | in the shop | boltban
étterem | in the restaurant | étteremben
kert | in the garden | kertben
város | in the city | városban
iskola | at school | iskolában
kávézó | in the café | kávézóban
autó | in the car | autóban
táska | in the bag | táskában
mozi | at the cinema | moziban
kórház | in hospital | kórházban
víz | in the water | vízben
szekrény | in the cupboard | szekrényben
London | in London | Londonban
Anglia | in England | Angliában
fürdőszoba | in the bathroom | fürdőszobában
hűtő | in the fridge | hűtőben
könyv | in the book | könyvben
tévé | on TV | tévében | Hungarian says "in the TV"!

#in-ba L1 after=in-ban | -ba/-be: into, to | Where to? — into a place. Back vowels: -ba, front vowels: -be. Megyek a boltba. = I'm going to the shop.
bolt | to the shop | boltba
iskola | to school | iskolába
ház | into the house | házba
szoba | into the room | szobába
mozi | to the cinema | moziba
étterem | to the restaurant | étterembe
kert | into the garden | kertbe
város | into town | városba
kórház | to hospital | kórházba
táska | into the bag | táskába
hűtő | into the fridge | hűtőbe
konyha | into the kitchen | konyhába
színház | to the theatre | színházba
Anglia | to England | Angliába
templom | to church | templomba
kocsma | to the pub | kocsmába

#in-bol L1 after=in-ba | -ból/-ből: out of, from | Where from? — out of a place. Also origin: Angliából jövök. = I come from England.
bolt | from the shop (out of it) | boltból
ház | out of the house | házból
iskola | from school | iskolából
szoba | out of the room | szobából
táska | out of the bag | táskából
hűtő | out of the fridge | hűtőből
pohár | out of a glass | pohárból
London | from London | Londonból
Anglia | from England | Angliából
kert | out of the garden | kertből
autó | out of the car | autóból
víz | out of the water | vízből
könyv | from the book | könyvből
mozi | from the cinema | moziból

#on-n L1 after=in-ban | -n/-on/-en/-ön: on, at | On a surface — and "in/at" for many places: Budapesten, a postán, az egyetemen, Magyarországon. After a vowel just -n.
asztal | on the table | asztalon
szék | on the chair | széken
föld | on the ground | földön
Budapest | in Budapest | Budapesten | Most Hungarian towns take -n
Magyarország | in Hungary | Magyarországon
posta | at the post office | postán
egyetem | at university | egyetemen
piac | at the market | piacon
busz | on the bus | buszon
vonat | on the train | vonaton
villamos | on the tram | villamoson
pályaudvar | at the railway station | pályaudvaron
repülőtér | at the airport | repülőtéren
utca | on the street | utcán
fal | on the wall | falon
emelet | upstairs (on the upper floor) | emeleten
koncert | at the concert | koncerten
strand | at the beach | strandon
sarok | on the corner | sarkon | sarok → sark-
tér | on the square | téren
munkahely | at work | munkahelyen
kép | in the picture | képen | Hungarian says "on the picture"
erkély | on the balcony | erkélyen
hegy | on the mountain | hegyen

#on-ra L2 after=on-n | -ra/-re: onto, to | Where to? — onto a surface, and "to" for the -n places: Budapestre, a postára, az egyetemre. Also deadlines: hétfőre = by Monday.
asztal | onto the table | asztalra
szék | onto the chair | székre
föld | onto the ground | földre
Budapest | to Budapest | Budapestre
Magyarország | to Hungary | Magyarországra
posta | to the post office | postára
egyetem | to university | egyetemre
piac | to the market | piacra
busz | onto the bus | buszra
vonat | onto the train | vonatra
pályaudvar | to the railway station | pályaudvarra
repülőtér | to the airport | repülőtérre
fal | onto the wall | falra
koncert | to the concert | koncertre
strand | to the beach | strandra
hétfő | by Monday; for Monday | hétfőre
ágy | onto the bed | ágyra
tető | onto the roof | tetőre

#on-rol L2 after=on-ra | -ról/-ről: off, from, about | Off a surface — "from" for the -n places (Budapestről) — and "about": a filmről = about the film.
asztal | off the table | asztalról
Budapest | from Budapest | Budapestről
Magyarország | from Hungary | Magyarországról
posta | from the post office | postáról
egyetem | from university | egyetemről
piac | from the market | piacról
busz | off the bus | buszról
vonat | off the train | vonatról
film | about the film | filmről
munka | about work | munkáról
élet | about life | életről
időjárás | about the weather | időjárásról
család | about the family | családról
könyv | about the book | könyvről
fal | off the wall | falról

#at-nal L2 after=in-ban | -nál/-nél: at, by, at someone's place | Next to something or at a person's place: az ablaknál (by the window), az orvosnál (at the doctor's), Péternél (at Peter's).
ablak | by the window | ablaknál
ajtó | at the door | ajtónál
orvos | at the doctor's | orvosnál
fodrász | at the hairdresser's | fodrásznál
nagymama | at Grandma's | nagymamánál
Péter | at Peter's (place) | Péternél
asztal | at the table | asztalnál
pénztár | at the checkout | pénztárnál
fogorvos | at the dentist's | fogorvosnál
szomszéd | at the neighbour's | szomszédnál
bejárat | at the entrance | bejáratnál
megálló | at the stop | megállónál
tó | by the lake | tónál
Anna | at Anna's | Annánál

#at-hoz L2 after=at-nal | -hoz/-hez/-höz: to (a person or place) | Towards something or to someone: az orvoshoz (to the doctor). Three forms: -hoz (back vowels), -hez (front), -höz (last vowel ö/ő/ü/ű).
orvos | to the doctor | orvoshoz
fodrász | to the hairdresser | fodrászhoz
nagymama | to Grandma's | nagymamához
Péter | to Peter('s) | Péterhez
ablak | to the window | ablakhoz
ajtó | to the door | ajtóhoz
asztal | to the table | asztalhoz
fogorvos | to the dentist | fogorvoshoz
szomszéd | to the neighbour's | szomszédhoz
tó | to the lake | tóhoz
főnök | to the boss | főnökhöz
tükör | to the mirror | tükörhöz
pénztár | to the checkout | pénztárhoz
Anna | to Anna('s) | Annához

#at-tol L2 after=at-hoz | -tól/-től: from (a person or place) | Away from something or someone: az orvostól (from the doctor), Pétertől (from Peter). In time: reggeltől = from the morning on.
orvos | from the doctor | orvostól
Péter | from Peter | Pétertől
anya | from Mum | anyától
nagymama | from Grandma | nagymamától
barát | from a friend | baráttól
főnök | from the boss | főnöktől
ablak | away from the window | ablaktól
reggel | from the morning on | reggeltől
hétfő | from Monday | hétfőtől
állomás | from the station | állomástól
szomszéd | from the neighbour | szomszédtól
tanár | from the teacher | tanártól

#val L2 after=acc | -val/-vel: with, by | "With" — or how you travel or pay: busszal (by bus), kártyával (by card). The v copies a final consonant: ház → házzal, kés → késsel.
barát | with a friend | baráttal
anya | with Mum | anyával
Péter | with Peter | Péterrel
busz | by bus | busszal
vonat | by train | vonattal
autó | by car | autóval
villamos | by tram | villamossal
taxi | by taxi | taxival
repülő | by plane | repülővel
kés | with a knife | késsel
villa | with a fork | villával
kanál | with a spoon | kanállal
kéz | by hand | kézzel
tej | with milk | tejjel
cukor | with sugar | cukorral
citrom | with lemon | citrommal
kártya | by card | kártyával
készpénz | in cash | készpénzzel
kutya | with the dog | kutyával
gyerek | with the child | gyerekkel
toll | with a pen | tollal | ll + v → ll (never three l's)

#nak L2 after=acc | -nak/-nek: to, for (someone) | The receiver: Péternek adom. = I give it to Peter. Also for "having": Péternek van kutyája. = Peter has a dog.
Péter | to/for Peter | Péternek
anya | to/for Mum | anyának
barát | to/for a friend | barátnak
gyerek | to/for the child | gyereknek
főnök | to/for the boss | főnöknek
tanár | to/for the teacher | tanárnak
nő | to/for the woman | nőnek
férfi | to/for the man | férfinak | férfi takes back-vowel endings
Anna | to/for Anna | Annának
kutya | to/for the dog | kutyának
mindenki | to/for everyone | mindenkinek
ki | to whom?; for whom? | kinek

#time L2 after=on-n | Time expressions | Days take -n/-on/-en/-ön (hétfőn, kedden) but vasárnap stays the same. Months take -ban/-ben. Seasons: nyáron, télen, tavasszal, ősszel. Clock times take -kor (hatkor = at six), but noon is délben.
hétfő | on Monday | hétfőn
kedd | on Tuesday | kedden
szerda | on Wednesday | szerdán
csütörtök | on Thursday | csütörtökön
péntek | on Friday | pénteken
szombat | on Saturday | szombaton
vasárnap | on Sunday | vasárnap | no ending! | vasárnapon / vasárnapban / vasárnapkor
hétvége | at the weekend | hétvégén
január | in January | januárban
május | in May | májusban
nyár | in summer | nyáron
tél | in winter | télen
tavasz | in spring | tavasszal | uses -val/-vel! | tavaszon / tavaszban / tavaszkor
ősz | in autumn | ősszel | uses -val/-vel! | őszön / őszben / őszkor
hat | at six (o'clock) | hatkor
nyolc | at eight (o'clock) | nyolckor
dél | at noon | délben | exception: -ben | délkor / délen / délre
éjfél | at midnight | éjfélkor
hány | at what time? | hánykor
karácsony | at Christmas | karácsonykor
reggel | in the morning | reggel | no ending! | reggelen / reggelben / reggelkor

#poss L2 after=plural | Possessive endings | my -m, your -d, his/her -a/-e (often -ja/-je), our -nk, your (plural) -tok/-tek/-tök, their -uk/-ük (or -juk/-jük). A linking vowel appears after consonants: házam, könyvem.
ház | my house | házam
ház | your house | házad
ház | his/her house | háza
ház | our house | házunk
ház | your (plural) house | házatok
ház | their house | házuk
autó | my car | autóm
autó | your car | autód
autó | his/her car | autója
autó | our car | autónk
autó | their car | autójuk
kutya | my dog | kutyám
kutya | his/her dog | kutyája
könyv | my book | könyvem
könyv | your book | könyved
könyv | his/her book | könyve
könyv | our book | könyvünk
könyv | your (plural) book | könyvetek
név | my name | nevem | név → nev-
név | your name | neved
név | his/her name | neve
barát | my friend | barátom
barát | his/her friend | barátja
család | my family | családom
család | our family | családunk
telefon | my phone | telefonom
telefon | his/her phone | telefonja
kert | our garden | kertünk
anya | my mother | anyám
anya | his/her mother | anyja | irregular: anyja
apa | my father | apám
apa | his/her father | apja | irregular: apja
fiú | my son | fiam | irregular: fiam, fiad, fia | fiúm / fiúnk / fiúja
fiú | his/her son | fia
lány | my daughter | lányom
lány | his/her daughter | lánya
feleség | my wife | feleségem
férj | my husband | férjem
fej | my head | fejem | Fáj a fejem. = My head hurts.
kéz | my hand | kezem | kéz → kez-
lakás | our flat | lakásunk
szoba | your room | szobád
idő | your time | időd | Van időd? = Do you have time?
pénz | my money | pénzem
kulcs | my key | kulcsom
táska | his/her bag | táskája
gyerek | their child | gyerekük
munka | my work; my job | munkám
könyv | my books | könyveim | several things: -im/-eim/-aim
barát | my friends | barátaim
gyerek | my children | gyerekeim
szülő | my parents | szüleim | irregular: szüleim | szülőim / szüleink / szülőm

#have L2 after=poss | "I have…" | There is no verb "to have". Say "there is my…": Van egy kutyám. = I have a dog. Negative: Nincs autóm. = I don't have a car.
kutya | I have a dog | Van egy kutyám. | | Van egy kutya. / Van egy kutyád. / Nincs kutyám.
autó | I don't have a car | Nincs autóm. | | Nem van autóm. / Nincs autód. / Van autóm.
idő | Do you have time? | Van időd? | | Van időm? / Van idő? / Nincs időd?
testvér | I have a brother/sister | Van egy testvérem. | | Van egy testvér. / Van egy testvérünk. / Nincs testvérem.
pénz | I have no money | Nincs pénzem. | | Nem van pénzem. / Nincs pénz. / Nincs pénzed.
kérdés | I have a question | Van egy kérdésem. | | Van egy kérdés. / Van egy kérdésed. / Van egy kérdésünk.
gyerek | Do you (formal) have children? | Van gyereke? | | Van gyereked? / Van gyerekem? / Van gyerek?
ötlet | I have an idea | Van egy ötletem. | | Van egy ötlet. / Van egy ötleted. / Nincs ötletem.
igaz | You're right (literally "you have truth") | Igazad van. | | Igazam van. / Igaz vagy. / Igazság van.
kedv | I don't feel like it | Nincs kedvem. | | Nem van kedvem. / Nincs kedved. / Van kedvem.
kocsi | Do you have a car? | Van kocsid? | | Van kocsim? / Van kocsi? / Van kocsink?

#pers L2 after=nak,val | Personal forms (nekem, veled…) | Case endings can't go on pronouns — they take personal endings instead: nekem (to me), veled (with you), tőle (from him/her), nálunk (at our place).
-nak/-nek | to me; for me | nekem
-nak/-nek | to you; for you | neked
-nak/-nek | to him/her | neki
-nak/-nek | to us | nekünk
-nak/-nek | to you all | nektek
-nak/-nek | to them | nekik
-val/-vel | with me | velem
-val/-vel | with you | veled
-val/-vel | with him/her | vele
-val/-vel | with us | velünk
-val/-vel | with you all | veletek
-val/-vel | with them | velük
-tól/-től | from me | tőlem
-tól/-től | from you | tőled
-tól/-től | from him/her | tőle
-tól/-től | from them | tőlük
-nál/-nél | at my place; on me (I have it with me) | nálam
-nál/-nél | at your place | nálad
-nál/-nél | at his/her place | nála
-nál/-nél | at our place | nálunk
-hoz/-hez | to me (towards me) | hozzám
-hoz/-hez | to you (towards you) | hozzád
-hoz/-hez | to him/her/it | hozzá
-ról/-ről | about me | rólam
-ról/-ről | about you | rólad
-ról/-ről | about him/her/it | róla
-ra/-re | onto me; on me (count on me) | rám
-ra/-re | onto you; at you (looking at you) | rád
-ra/-re | onto it; on it | rá
-ban/-ben | in me | bennem
-ban/-ben | in it; in him/her | benne | Benne vagyok! = I'm in!
-ból/-ből | out of it; from it | belőle
-ért | for me (for my sake) | értem | Same spelling as "Értem." = I understand!
-ért | for you (for your sake) | érted
-t (object) | me (as object) | engem
-t (object) | you (as object) | téged
-t (object) | him/her (as object) | őt
-t (object) | us (as object) | minket
-t (object) | you all (as object) | titeket
-t (object) | them (as object) | őket
-n/-on | on me (wearing it; it's up to me) | rajtam
-n/-on | on him/her/it | rajta
-é (whose) | mine | enyém
-é (whose) | yours | tiéd
-é (whose) | his/hers | övé

#future L2 after=v-pres | Future | Use the present with a time word (Holnap dolgozom), or fog + infinitive (Holnap fogok dolgozni). "Will be" is lesz: leszek, leszel, lesz…
lenni | I will be | leszek
lenni | you will be | leszel
lenni | he/she/it will be | lesz
lenni | we will be | leszünk
lenni | you all will be | lesztek
lenni | they will be | lesznek
menni | I will go | fogok menni / menni fogok | | fogsz menni / fogok jönni / mentem
csinálni | What are you going to do? | Mit fogsz csinálni? | | Mit fogok csinálni? / Mit csináltál? / Mit akarsz csinálni?
esni | It's going to rain | Esni fog. | | Esett. / Esik. / Havazni fog.
látni | We'll see | Majd meglátjuk. | majd + present = future | Majd meglátod. / Láttuk. / Majd meglátom.

#pref L2 after=v-pres | Verb prefixes | Prefixes add direction or completion: be- in, ki- out, fel- up, le- down, el- away, vissza- back, haza- home, át- across, oda- there, ide- here, meg- (completes the action), össze- together.
megy | go in | bemegy
megy | go out | kimegy
megy | go up | felmegy
megy | go down | lemegy
megy | go away; leave | elmegy
megy | go back | visszamegy
megy | go home | hazamegy
megy | cross; go over | átmegy
megy | go over there (to someone) | odamegy
jön | come in | bejön
jön | come out | kijön
jön | come back | visszajön
jön | come home | hazajön
jön | come over | átjön
jön | come here | idejön
jön | come along (to an event) | eljön
jön | work out; come together | összejön | Összejött! = It worked out!
néz | have a look; watch (it through) | megnéz
néz | look (appearance); look out | kinéz | Jól nézel ki! = You look good!
néz | look around | körülnéz
néz | drop in; peek in | benéz
ad | sell | elad
ad | give back | visszaad
ad | give up; post (a letter) | felad
ad | hand over | átad
ad | hand in | bead
vesz | buy (it) | megvesz
vesz | put on (clothes); pick up | felvesz
vesz | take off | levesz
vesz | take out | kivesz
vesz | take away | elvesz
vesz | take (medicine) | bevesz
tesz | put in | betesz
tesz | put down | letesz
tesz | put away | eltesz
tesz | put up; ask (a question) | feltesz
hív | call (on the phone) | felhív
hív | invite | meghív
hív | call back | visszahív
fizet | pay (for it); pay off | kifizet
fizet | pay back | visszafizet
ír | write down | leír
ír | sign | aláír
mond | tell; recount | elmond
mond | cancel; give up | lemond
mond | quit (a job) | felmond
kel | get up | felkel
ül | sit down | leül
áll | stand up | feláll
áll | stop | megáll
fekszik | lie down; go to bed | lefekszik
alszik | fall asleep | elalszik
nyit | open (up) | kinyit
zár | close; lock | bezár
kapcsol | switch on | bekapcsol
kapcsol | switch off | kikapcsol
indul | set off | elindul
érkezik | arrive | megérkezik
tanul | learn (fully) | megtanul
ért | understand (get it) | megért
ért | misunderstand | félreért
ismer | get to know | megismer
ismer | recognise | felismer
kezd | begin | elkezd
eszik | eat up | megeszik
iszik | drink up | megiszik
csinál | get it done; fix | megcsinál
visz | take away | elvisz
visz | take back | visszavisz
hoz | bring back | visszahoz
hoz | bring (along); fetch | elhoz
kérdez | ask (once) | megkérdez
mutat | show | megmutat
beszél | discuss; talk over | megbeszél
fordul | turn around | megfordul
próbál | try out | kipróbál
próbál | try on (clothes) | felpróbál
száll | get in (a car) | beszáll
száll | get out (of a car) | kiszáll
lép | enter; log in | belép
lép | exit; log out | kilép
fut | run away | elfut
dob | throw out | kidob
dob | throw away | eldob
húz | pull up; put on (shoes) | felhúz
húz | pull down; flush (the toilet) | lehúz
fog#v | grab; take hold of | megfog
fog#v | catch; arrest | elfog
ad | add | hozzáad
rak | put away | elrak
rak | put in; load | berak
nő#v | grow up | felnő

#hat L2 after=v-pres | -hat/-het: can, may | Add -hat/-het to the verb stem: mehetek (I may go), ehetek (I can eat). Perfect for polite questions: Segíthetek? = Can I help?
segít | Can I help? | Segíthetek? | | Segíthetsz? / Segítettem? / Segítenek?
bejön | May I come in? | Bejöhetek? | | Bejöhetsz? / Bemehetek? / Bejövök?
leül | May I sit down? | Leülhetek? | | Leülhetsz? / Leülök? / Felállhatok?
fizet | Can I pay by card? | Fizethetek kártyával? | | Fizethetsz kártyával? / Fizetek kártyával? / Fizethetek készpénzzel?
kérdez | May I ask something? | Kérdezhetek valamit? | | Kérdezhetsz valamit? / Kérdezek valamit? / Kérhetek valamit?
kipróbál | Can I try it? | Kipróbálhatom? | | Kipróbálhatok? / Kipróbálhatod? / Kipróbálom?
megy | We can go | Mehetünk. | | Megyünk. / Mehettek. / Mehetek.
jön | You can come | Jöhetsz. | | Jössz. / Jöhetek. / Mehetsz.
eszik | Can I eat? | Ehetek? | | Eszek? / Ehetsz? / Ihatok?
iszik | Can I drink? | Ihatok? | | Iszok? / Ihatsz? / Ehetek?
lát | Can I see it? | Láthatom? | | Láthatok? / Láthatod? / Látom?
hív | Can I call you? | Hívhatlak? | | Hívhatsz? / Hívhatom? / Hívlak?
kér | Can I have a glass of water? | Kérhetek egy pohár vizet? | | Kérdezhetek egy pohár vizet? / Kérhetsz egy pohár vizet? / Kérek egy pohár víz?
megnéz | Can I have a look at it? | Megnézhetem? | | Megnézhetek? / Megnézheted? / Megnézem?
használ | Can I use it? | Használhatom? | | Használhatok? / Használhatod? / Használom?
marad | Can I stay? | Maradhatok? | | Maradhatsz? / Maradok? / Mehetek?

#comp L2 | Comparison | Comparative -bb (with a linking vowel: -abb/-ebb). Superlative leg- … -bb. Irregular: jó → jobb, sok → több, kicsi → kisebb, szép → szebb. "Than" = mint.
jó | better (adjective) | jobb | | jóbb / jobban / legjobb
jó | the best | legjobb
rossz | worse | rosszabb
nagy | bigger | nagyobb
nagy | the biggest | legnagyobb
kicsi | smaller | kisebb | | kicsibb / kicsebb / kisebben
sok | more | több | | sokabb / leginkább / legtöbb
sok | the most | legtöbb
kevés | less; fewer | kevesebb
szép | more beautiful | szebb | | szépebb / szebben / legszebb
szép | the most beautiful | legszebb
könnyű | easier | könnyebb
nehéz | harder; heavier | nehezebb
drága | more expensive | drágább
olcsó | cheaper | olcsóbb
gyors | faster | gyorsabb
lassú | slower | lassabb | | lassúbb / lassúabb / lassan
hosszú | longer | hosszabb
magas | taller; higher | magasabb
fiatal | younger | fiatalabb
öreg | older | öregebb
közel | closer | közelebb
messze | further | messzebb
hamar | sooner | hamarabb
szívesen | rather (more gladly) | szívesebben
jól | better (adverb) | jobban | Jobban vagyok. = I feel better.
régi | older (thing) | régebbi

#adv L2 after=comp | Adverbs & languages | Adjective → adverb with -an/-en (gyorsan), sometimes -ul/-ül (rosszul) or irregular (jól). Languages: -ul/-ül means "in": magyarul = in Hungarian.
gyors | quickly | gyorsan
lassú | slowly | lassan
szép | nicely | szépen
jó | well | jól | | jóan / jón / jobban
rossz | badly | rosszul
könnyű | easily | könnyen
nehéz | with difficulty | nehezen
hangos | loudly | hangosan
csendes | quietly | csendesen
pontos | exactly; on time | pontosan
boldog | happily | boldogan
biztos | surely | biztosan
magyar | in Hungarian | magyarul
angol | in English | angolul
német | in German | németül
francia | in French | franciául
olasz | in Italian | olaszul
spanyol | in Spanish | spanyolul

#ig-ert L3 after=time | -ig, -ért | -ig = until, as far as: holnapig, a sarokig. -ért = for, in exchange for, to fetch: Elmegyek kenyérért. = I'll go and get some bread.
holnap | until tomorrow | holnapig
hétfő | until Monday | hétfőig
este | until the evening | estig | este + -ig → estig
öt | until five (o'clock) | ötig
sarok | as far as the corner | sarokig
reggel | until the morning | reggelig
Budapest | as far as Budapest | Budapestig
kenyér | for bread (to fetch some) | kenyérért
pénz | for money | pénzért
gyerek | for the child (to pick them up) | gyerekért
mi#q | what for?; why? | miért

#qcase L3 after=pers | Question words with endings | Question words take case endings too: kivel? (with whom?), kitől? (from whom?), miről? (about what?), mibe? (into what?).
ki | with whom? | kivel
ki | from whom? | kitől
ki | about whom? | kiről
ki | at whose place? | kinél
ki | to whom (towards)? | kihez
mi#q | with what?; by what? | mivel
mi#q | about what? | miről
mi#q | in what? | miben
mi#q | into what? | mibe
mi#q | out of what? | miből
mi#q | on what? | min | Min gondolkodsz? = What are you thinking about?
mi#q | onto what?; what for? | mire
mi#q | what's the point?; what for? | minek
mennyi | how much (does it cost)? | mennyibe | Mennyibe kerül?
hány | what number?; what size? | hányas | Hányas cipőt hordasz? = What size shoes do you wear?

#clock L3 after=time | Telling the time | Hungarian counts towards the NEXT hour: fél három = 2:30 (half of three), negyed három = 2:15, háromnegyed három = 2:45. "At" = -kor: fél hatkor.
óra | 2:00 (two o'clock) | két óra | | kettő óra / fél kettő / két órakor
óra | 2:30 | fél három | half of the third hour | fél kettő / negyed három / háromnegyed három
óra | 2:15 | negyed három | a quarter of the third hour | negyed kettő / fél három / háromnegyed kettő
óra | 2:45 | háromnegyed három | three quarters of the third hour | háromnegyed kettő / negyed három / fél három
óra | 7:30 | fél nyolc | | fél hét / negyed nyolc / háromnegyed nyolc
óra | 9:15 | negyed tíz | | negyed kilenc / fél tíz / háromnegyed tíz
óra | 11:45 | háromnegyed tizenkettő | | háromnegyed tizenegy / negyed tizenkettő / fél tizenkettő
óra | 12:30 | fél egy | | fél tizenkettő / negyed egy / háromnegyed egy
óra | 6:15 | negyed hét | | negyed hat / fél hét / háromnegyed hét
óra | 4:45 | háromnegyed öt | | háromnegyed négy / negyed öt / fél öt
óra | at 8:30 | fél kilenckor | | fél nyolckor / fél kilenc / negyed kilenckor
óra | at 10:15 | negyed tizenegykor | | negyed tízkor / negyed tizenegy / fél tizenegykor
óra | at one o'clock | egykor | | egyre / egy óra / kettőkor
óra | at midday | délben | | délkor / délen / éjfélkor

#ordinal L3 | Ordinal numbers & dates | -dik makes ordinals: negyedik (4th), ötödik (5th). Dates use a possessive form: május elseje (1st May), március tizenötödike (15th March).
négy | fourth | negyedik | | negyed / négyedik / negyven
öt | fifth | ötödik | | ötik / ötöd / ötven
hat | sixth | hatodik | | hatik / hatod / hetedik
hét#num | seventh | hetedik | | hétedik / hatodik / hetven
nyolc | eighth | nyolcadik | | nyolcik / nyolcad / nyolcvan
kilenc | ninth | kilencedik | | kilencik / kilenced / kilencven
tíz | tenth | tizedik | | tízedik / tized / tizenegy
húsz | twentieth | huszadik | | húszadik / huszonegy / huszad
száz | hundredth | századik | | százodik / század / százszor
május | the first of May | május elseje | | május első / május egy / május egyedike
március | the fifteenth of March | március tizenötödike | | március tizenöt / március tizenötödik / március ötödike
augusztus | the twentieth of August | augusztus huszadika | | augusztus húsz / augusztus huszadik / augusztus huszonegy

#post L3 after=pers | Postpositions | Words like előtt (in front of), után (after), nélkül (without) come AFTER the noun: a ház előtt. With pronouns they take personal endings: előttem, utánad, nélküle.
ház | in front of the house | a ház előtt
ház | behind the house | a ház mögött
ablak | next to the window | az ablak mellett
asztal | under the table | az asztal alatt
város | above the city | a város fölött
tó | around the lake | a tó körül
ebéd | after lunch | ebéd után
vacsora | before dinner | vacsora előtt
cukor | without sugar | cukor nélkül
eső | because of the rain | az eső miatt
kávé | instead of coffee | kávé helyett
reggel | since the morning | reggel óta
perc | in five minutes | öt perc múlva
város | towards the city | a város felé
film | during the film | a film alatt
park | through the park | a parkon keresztül | keresztül takes -n
fa | between the trees | a fák között
én | without me | nélkülem
te | without you | nélküled
én | next to me | mellettem
te | in front of you | előtted
ő | behind him/her | mögötte
te | after you | utánad | Csak utánad! = After you!
én | because of me | miattam
te | instead of you | helyetted
én | in my opinion | szerintem
te | in your opinion? | szerinted
ő | according to him/her | szerinte
én | around me | körülöttem
én | towards me | felém

#dem L3 after=in-bol,on-rol | ez/az + endings | "This" and "that" take endings too, and the z blends in: ez + -ben → ebben (in this), az + -ból → abból (out of that). With a noun: ebben a házban = in this house.
ez | in this | ebben
az | in that | abban
ez | into this | ebbe
az | into that | abba
ez | out of this | ebből
az | out of that | abból
ez | on this | ezen
az | on that | azon
ez | onto this; this way | erre
az | onto that; that way | arra
ez | about this | erről
az | about that | arról
ez | with this | ezzel
az | with that | azzal
ez | to/for this | ennek
az | to/for that | annak
ez | from this | ettől
az | from that | attól | Attól függ. = It depends.
ez | for this; that's why | ezért
az | for that; still; anyway | azért
ez | to this | ehhez
az | to that | ahhoz
ez | at this; than this | ennél
az | at that; than that | annál
ez | until this point; so far | eddig
az | until then | addig
ez | this much; this many | ennyi
az | that much; that many | annyi
ez | like this; this kind of | ilyen
az | like that; that kind of | olyan

#order L3 after=pref,v-imp | Prefix word order | Prefixes split off and move after the verb in negatives, questions, commands and with helper verbs: Nem megyek be. · Be akarok menni. · Gyere be!
bemegy | I'm not going in | Nem megyek be. | | Nem bemegyek. / Nem megyek ki. / Nem jövök be.
bemegy | I want to go in | Be akarok menni. | | Akarok bemenni. / Be akarok jönni. / Ki akarok menni.
bejön | Come in! | Gyere be! | | Bejöjj! / Gyere ki! / Menj be!
leül | Sit down! | Ülj le! | | Leülj! / Állj fel! / Ülj fel!
leül | Please sit down (formal) | Üljön le! | | Ülj le! / Leüljön! / Üljön fel!
felhív | Call me! | Hívj fel! | | Felhívj! / Felhívlak! / Hívd fel!
felhív | I'll call you | Felhívlak. | | Felhívsz. / Hívlak fel. / Felhívom.
megnéz | Have a look at it! | Nézd meg! | | Megnézd! / Nézz meg! / Megnézed!
elmegy | Don't go away! | Ne menj el! | | Ne elmenj! / Ne menj be! / Menj el!
elmegy | I have to leave | El kell mennem. | | Kell elmennem. / El kell menned. / El kell jönnöm.
megcsinál | I can't do it | Nem tudom megcsinálni. | | Nem tudok megcsinálni. / Nem megcsinálni tudom. / Nem tudod megcsinálni.
elfelejt | Don't forget it! | Ne felejtsd el! | | Ne elfelejtsd! / Ne felejts el! / Ne felejtsem el!
kinyit | Open it! | Nyisd ki! | | Kinyisd! / Nyiss ki! / Nyisd be!
becsuk | Close the door! | Csukd be az ajtót! | | Becsukd az ajtót! / Csukj be az ajtót! / Csukd ki az ajtót!
megvár | Wait for me! | Várj meg! | | Várd meg! / Megvárj! / Várlak meg!
visszajön | When are you coming back? | Mikor jössz vissza? | | Mikor visszajössz? / Mikor mész vissza? / Mikor jöttél vissza?
felkel | I don't want to get up | Nem akarok felkelni. | | Nem akarok kelni fel. / Nem akarok lefeküdni. / Nem akarsz felkelni.
megmutat | Show me (it)! | Mutasd meg! | | Megmutasd! / Mutass meg! / Mutasd be!
elmond | Tell me (it)! | Mondd el! | | Elmondd! / Mondj el! / Mondom el!
bekapcsol | Turn it on! | Kapcsold be! | | Bekapcsold! / Kapcsolj be! / Kapcsold ki!
kikapcsol | Turn it off! | Kapcsold ki! | | Kikapcsold! / Kapcsolj ki! / Kapcsold be!
megkóstol | Taste it! | Kóstold meg! | | Megkóstold! / Kóstolj meg! / Kóstold ki!
hazamegy | I'm not going home yet | Még nem megyek haza. | | Még nem hazamegyek. / Még nem megyek el. / Még nem jövök haza.

#deriv L3 | Word building | -ás/-és turns verbs into nouns (tanulás = studying), -ó/-ő makes the doer (tanuló = student), -i makes adjectives from places and times (budapesti, mai), -s means "with/having" (sós = salty), -ság/-ség makes abstract nouns (boldogság = happiness).
tanul | studying; learning | tanulás
olvas | reading | olvasás
ír | writing | írás
fizet | payment; salary | fizetés
vásárol | shopping | vásárlás | the o drops: vásárl-
úszik | swimming | úszás
főz | cooking | főzés
utazik | travel; trip | utazás
érkezik | arrival | érkezés
indul | departure | indulás
kérdez | question | kérdés
takarít | cleaning | takarítás
tanul | student; learner | tanuló
olvas | reader | olvasó
ír | writer | író
vezet | driver; leader | vezető
elad | seller; shop assistant | eladó
vesz | buyer; customer | vevő
néz | viewer | néző
kezd | beginner | kezdő
Budapest | from Budapest (adjective) | budapesti
ma | today's | mai
holnap | tomorrow's | holnapi
tegnap | yesterday's | tegnapi
este | evening (adjective) | esti
nyár | summer (adjective) | nyári
tél | winter (adjective) | téli
város | city (adjective); urban | városi
só | salty | sós
cukor | sweetened; with sugar | cukros
víz | wet | vizes
nap | sunny | napos
felhő | cloudy | felhős
eső | rainy | esős
szél | windy | szeles
szerencse | lucky | szerencsés
siker | successful | sikeres
szín | colourful | színes
zaj | noisy | zajos
szabad | freedom; holiday | szabadság
beteg | illness | betegség
boldog | happiness | boldogság
szép | beauty | szépség
barát | friendship | barátság
igaz | truth | igazság
nehéz | difficulty | nehézség
egész | health | egészség | egész = whole

#talan L3 after=deriv | -talan/-telen: without, un- | -talan/-telen = without: szerencsétlen (unlucky), lehetetlen (impossible). -hatatlan/-hetetlen = un-…-able: hihetetlen (unbelievable).
szerencse | unlucky | szerencsétlen
lehet | impossible | lehetetlen
remény | hopeless | reménytelen
türelem | impatient | türelmetlen | türelem → türelm-
értelem | meaningless; pointless | értelmetlen | értelem → értelm-
só | unsalted | sótlan
íz | tasteless; bland | ízetlen
hisz | unbelievable | hihetetlen
felejt | unforgettable | felejthetetlen
eszik | inedible | ehetetlen
elképzel | unimaginable | elképzelhetetlen

#times L3 | -szor/-szer/-ször: times | How many times: egyszer (once), kétszer (twice), háromszor (three times). Hányszor? = How many times?
egy | once | egyszer
két | twice | kétszer
három | three times | háromszor
négy | four times | négyszer
öt | five times | ötször
tíz | ten times | tízszer
sok | many times | sokszor
hány | how many times? | hányszor
száz | a hundred times | százszor
több | several times | többször

#habit L4 after=v-past | Usually: szokott | "Usually" is a verb in Hungarian: szoktam + infinitive (I usually…). It looks like a past tense but means the present habit: Reggel kávét szoktam inni. = I usually drink coffee in the morning.
szokott | I usually (do something) | szoktam | | szokok / szokom / szoktunk
szokott | you usually (do something) | szoktál | | szoksz / szokol / szoktatok
szokott | we usually (do something) | szoktunk | | szokunk / szoktatok / szoktam
szokott | you all usually (do something) | szoktatok | | szoktok / szoktunk / szoktál
szokott | they usually (do something) | szoktak | | szoknak / szokják / szoktok
szokott | I usually drink coffee | Kávét szoktam inni. | | Kávét szokok inni. / Kávét iszom szokott. / Kávét szoktál inni.
szokott | Where do you usually go? | Hova szoktál menni? | | Hova szoksz menni? / Hova szoktam menni? / Hova mentél?

#should L4 after=v-imp | Should I…? | The command form also asks "should I…?": Menjek? (Should I go?), Segítsek? (Shall I help?), Mit csináljak? (What should I do?). With a definite object: Kinyissam az ablakot?
csinálni | What should I do? | Mit csináljak? | | Mit csinálok? / Mit csináljon? / Mit csinálsz?
segíteni | Shall I help? | Segítsek? | | Segítek? / Segítesz? / Segítsen?
menni | Where should I go? | Hova menjek? | | Hova megyek? / Hova menj? / Hova menjen?
hozni | Shall I bring something? | Hozzak valamit? | | Hozok valamit? / Hozz valamit? / Hozzon valamit?
nyitni | Shall I open the window? | Kinyissam az ablakot? | | Kinyissak az ablakot? / Kinyitottam az ablakot? / Nyisd ki az ablakot!
mondani | What should I say? | Mit mondjak? | | Mit mondok? / Mit mondj? / Mit mondasz?
várni | Should I wait? | Várjak? | | Várok? / Várj? / Várjon?
fizetni | Should I pay now? | Most fizessek? | | Most fizetek? / Most fizess? / Most fizetsz?
lenni | Have a nice day! (literally "let your day be nice") | Legyen szép napod! | | Szép napod van! / Legyél szép napod! / Lesz szép napod!

#postdir L4 after=post | Where to / from, with postpositions | Many postpositions have "to" and "from" forms: elé (to the front of), mögé (to behind), alá (to under), mellé (to beside) — and elől, mögül, alól, mellől, közül (from).
ház | (go) in front of the house | a ház elé
ház | (go) behind the house | a ház mögé
asztal | (put it) under the table | az asztal alá
ablak | (put it) next to the window | az ablak mellé
asztal | from under the table | az asztal alól
ház | from behind the house | a ház mögül
ablak | from beside the window | az ablak mellől
fa | from among the trees | a fák közül
én | (sit) next to me | mellém

#family L4 after=poss | -ék, -é, -né | -ék = someone and their family/group: Kovácsék (the Kovácses), Péterék (Peter and co.). -é = belonging to: Péteré (Peter's), kié? (whose?). -né = Mrs: Kovácsné.
Kovács | the Kovács family | Kovácsék
Péter | Peter and his family/friends | Péterék
szomszéd | the neighbours (the family next door) | szomszédék
Péter | Peter's (it belongs to Peter) | Péteré
ki | whose? | kié
anya | Mum's | anyáé
Kovács | Mrs Kovács | Kovácsné
Szabó | Mrs Szabó | Szabóné

#gat L4 after=deriv | -gat/-get: casually, repeatedly | Adds a relaxed or repeated feel: olvasgat (read a bit here and there). Sometimes the meaning shifts: beszélget (chat), hallgat (listen).
olvas | read leisurely | olvasgat
néz | browse; look around casually | nézeget
ír | write now and then | írogat
beszél | chat | beszélget
sétál | stroll around | sétálgat
kérdez | keep asking | kérdezget
iszik | sip | iszogat
hall | listen | hallgat | meaning shift!

#tat L4 after=gat | -tat/-tet: have it done, make someone… | Causative: megcsináltatom (I'll have it fixed), etet (feed), nevettet (make laugh).
csinál | have it done or made | csináltat
javít | have it repaired | javíttat
mos | have it washed | mosat
eszik | feed | etet | irregular
iszik | give a drink to; water (animals) | itat | irregular
nevet | make (someone) laugh | nevettet
vár | keep (someone) waiting | várat
ír | have it written; make (someone) write | írat

#rel L5 after=qcase | Relative words (aki, ami, ahol…) | Relative words start with a-: aki (who), ami (which, that), ahol (where), amikor (when). They take endings too: akinek (to whom), akivel (with whom), amiről (about which).
ki | who (relative): the man who… | aki
ki | whom (relative, as object): the man whom… | akit
ki | to whom; whose (relative) | akinek
ki | with whom (relative) | akivel
ki | from whom (relative) | akitől
mi#q | which; that (relative, as object): the thing that I… | amit
mi#q | about which (relative) | amiről
mi#q | in which (relative) | amiben
mi#q | with which (relative) | amivel
hol | where (relative): the place where… | ahol
hova | where to (relative) | ahova
honnan | where from (relative) | ahonnan
mikor | when (relative) | amikor
melyik | which one (relative) | amelyik
milyen | the kind that; as | amilyen
mennyi | as much as | amennyi
hogyan | the way that; as | ahogy

#part L5 after=deriv | Participles: -va/-ve, -t/-tt, -ó/-ő | Verbs become adverbs and adjectives: ülve (sitting), nyitva (open), sült (fried), a megírt levél (the written letter), ijesztő (frightening).
ül | (while) sitting | ülve
áll | (while) standing | állva
fekszik | (while) lying down | fekve
nyit | open (as in "the shop is open") | nyitva
zár | closed (as in "the shop is closed") | zárva
fut | running (He arrived running.) | futva
süt | fried; baked; roasted | sült
főz | boiled; cooked | főtt
tölt | stuffed; filled | töltött
fagyaszt | frozen | fagyasztott
foglal | reserved; taken | foglalt
elromlik | broken (a broken machine) | elromlott
megír | written (the written letter) | megírt
elvész | lost (the lost key) | elveszett
meglep | surprising | meglepő
ijeszt | frightening | ijesztő
idegesít | annoying | idegesítő
következik | following; next | következő

#minel L5 after=comp | The more…, the more… | minél + comparative … annál + comparative: Minél több, annál jobb. = The more, the better. Also: minél előbb = as soon as possible.
sok | the more, the better | minél több, annál jobb | | minél több, annál jobban / több, annál jobb / minél jobb, annál több
korán | as soon as possible | minél előbb | | minél később / előbb vagy utóbb / mindjárt
gyors | as fast as possible | minél gyorsabban | | minél gyorsabb / milyen gyorsan / a leggyorsabb
hamar | sooner or later | előbb-utóbb | | minél előbb / korán vagy későn / később-előbb

#stul L6 after=val,time | -stul/-stül, -nta/-nte, -ként | -stul/-stül = together with: családostul (with the whole family). -nta/-nte = every…: naponta (daily), hetente (weekly). -ként = as: barátként (as a friend). Also -nként = per/by: egyenként (one by one), fejenként (per head).
család | with the whole family | családostul
kutya | together with the dog | kutyástul
nap | daily; every day | naponta
hét#n | weekly; every week | hetente
hónap | monthly; every month | havonta
év | yearly; every year | évente
egy | one by one | egyenként
fej | per head; per person | fejenként
barát | as a friend | barátként
tanár | as a teacher | tanárként
ajándék | as a present (I got it as a present) | ajándékba | Ajándékba kaptam. = I got it as a present.
`;
