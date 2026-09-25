import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  Flame,
  Calendar,
  BookOpen,
  MapPin,
  ExternalLink,
  Search,
  Sparkles,
  CheckCircle2,
  ListChecks,
  ChevronRight,
  Info,
  Clock,
  Languages,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';

type Lang = 'english' | 'tagalog';
type Season = 'All' | 'Spring' | 'Summer' | 'Fall' | 'Winter';
type Rank = 'Major' | 'Minor';

interface FeastContent {
  description: string;
  prophecy?: string;
  activities: string[];
  preparation: string[];
}

interface Feast {
  id: string;
  name: string;
  tagalogName?: string;
  hebrewName: string;
  hebrewDate: string;
  gregMonth: string;
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  rank: Rank;
  reference: string;
  bibleBook?: string;
  bibleChapter?: number;
  image: string;
  locationInIsrael: string;
  color: string;
  accentDot: string;
  content: { english: FeastContent; tagalog: FeastContent };
}

const FEASTS: Feast[] = [
  {
    id: 'passover',
    name: 'Passover',
    tagalogName: 'Paskuwa',
    hebrewName: 'פֶּסַח — Pesach',
    hebrewDate: 'Nisan 14',
    gregMonth: 'March – April',
    season: 'Spring',
    rank: 'Major',
    reference: 'Leviticus 23:5; Exodus 12',
    bibleBook: 'Leviticus',
    bibleChapter: 23,
    image: '/feasts/passover_israel.jpg',
    locationInIsrael: 'Old City, Jerusalem, Israel',
    color: '#B45309',
    accentDot: '#FCD34D',
    content: {
      english: {
        description:
          "Passover commemorates the night God struck the firstborn of Egypt and passed over the homes of the Israelites marked with lamb's blood. It is the foundational feast of redemption — pointing prophetically to Yeshua (Jesus) as the Lamb of God who takes away the sin of the world (John 1:29; 1 Cor 5:7).",
        prophecy:
          "Fulfilled in the sacrifice of Yeshua on Passover day at the exact hour the Passover lambs were being slain at the Temple (1 Corinthians 5:7; John 19:14).",
        activities: [
          'The Passover Seder meal — a liturgical dinner re-enacting the Exodus',
          'Eating lamb, bitter herbs (maror), and matzah (unleavened bread)',
          'Recounting the ten plagues and Israel\'s deliverance (Maggid)',
          'Drinking four cups of wine representing God\'s four promises (Exodus 6:6-7)',
          'Singing Hallel Psalms (113–118)',
        ],
        preparation: [
          'Remove all chametz (leaven) from the home — spiritually representing removal of sin',
          'Prepare the Seder plate: lamb shank, bitter herbs, charoset, parsley, roasted egg',
          'Set the table with an extra cup for Elijah and cushions for reclining',
          'Study the Exodus narrative and its prophetic fulfillment in Messiah',
          'Dress in white as a symbol of purity, festivity, and redemption',
        ],
      },
      tagalog: {
        description:
          'Ang Paskuwa ay naggunita sa gabing sinalanta ng Diyos ang mga panganay ng Ehipto at lumampas sa mga tahanan ng mga Israelita na may markang dugo ng kordero. Ito ang pangunahing kapistahan ng katubusan — nagtaturo sa hula kay Hesus bilang Kordero ng Diyos na nag-aalis ng kasalanan ng mundo (Juan 1:29; 1 Cor 5:7).',
        prophecy:
          'Natupad sa sakripisyo ni Hesus sa mismong araw ng Paskuwa sa eksaktong oras ng pag-aalay ng mga kordero sa Templo (1 Corinto 5:7; Juan 19:14).',
        activities: [
          'Ang Seder na hapunan ng Paskuwa — isang ritwal na pagkain na muling naglarawan ng Exodus',
          'Pagkain ng kordero, mapait na damo (maror), at matzah (tinapay na walang lebadura)',
          'Pagkukuwento ng sampung salot at pagliligtas sa Israel',
          'Pag-inom ng apat na tasa ng alak na kumakatawan sa apat na pangako ng Diyos',
          'Pag-awit ng Hallel Psalmo (113–118)',
        ],
        preparation: [
          'Alisin ang lahat ng chametz (lebadura) sa tahanan — kinatawan ng pag-aalis ng kasalanan',
          'Ihanda ang plato ng Seder: buto ng kordero, mapait na damo, charoset, perehil, itlog',
          'Magtakda ng mesa na may dagdag na tasa para kay Elias',
          'Pag-aralan ang kwento ng Exodus at ang katuparan nito sa Mesiyas',
          'Magbihis ng puti bilang simbolo ng kadalisayan at kaligtasan',
        ],
      },
    },
  },
  {
    id: 'unleavened',
    name: 'Feast of Unleavened Bread',
    tagalogName: 'Pista ng Tinapay na Walang Lebadura',
    hebrewName: 'חַג הַמַּצּוֹת — Chag HaMatzot',
    hebrewDate: 'Nisan 15–21',
    gregMonth: 'March – April',
    season: 'Spring',
    rank: 'Major',
    reference: 'Leviticus 23:6-8; Exodus 12:17-20',
    bibleBook: 'Leviticus',
    bibleChapter: 23,
    image: '/feasts/unleavened_israel.jpg',
    locationInIsrael: 'Mea Shearim, Jerusalem, Israel',
    color: '#92400E',
    accentDot: '#FDE68A',
    content: {
      english: {
        description:
          'The seven-day feast immediately following Passover during which no leaven is eaten. Leaven in Scripture symbolizes sin and corruption. Eating unleavened bread pictures walking in holiness and sincerity (1 Cor 5:8). Prophetically, this feast points to the sinless body of the Messiah who was buried on the first day (Nisan 15).',
        prophecy:
          "Messiah's sinless body was buried in the tomb without decay during Unleavened Bread (Psalm 16:10; Acts 2:27).",
        activities: [
          'Eating matzah (unleavened bread) for seven consecutive days',
          'A holy convocation on the first and seventh days with no regular work',
          'Offering special sacrifices and prayers',
          'Teaching children about the haste of the Exodus departure',
          'Removing chametz bread entirely from home and property',
        ],
        preparation: [
          'Thorough search for leaven (Bedikat Chametz) the night before with a candle',
          'Burn all found chametz on the morning of Nisan 14 (Biur Chametz)',
          'Stock up on matzah and clean foods for the week',
          'Plan meals around vegetables, fruits, eggs, fish, and clean grains',
          'Set aside the first and seventh days as Shabbat rest days',
        ],
      },
      tagalog: {
        description:
          'Ang pitong araw na kapistahan na agad sumusunod sa Paskuwa kung saan walang tinapay na may lebadura ang kinakain. Ang lebadura sa Kasulatan ay simbolo ng kasalanan at kabulukan. Ang pagkain ng tinapay na walang lebadura ay larawan ng pamumuhay sa kabanalan (1 Cor 5:8). Sa hula, ang kapistahang ito ay nagtuturo sa katawang walang kasalanan ng Mesiyas na inilibing sa unang araw.',
        prophecy:
          'Ang banal at walang kasalanang katawan ng Mesiyas ay inilibing nang walang pagkabulok (Awit 16:10; Gawa 2:27).',
        activities: [
          'Pagkain ng matzah (tinapay na walang lebadura) nang pitong magkakasunod na araw',
          'Isang banal na pagtitipon sa una at ikapitong araw na walang regular na trabaho',
          'Pag-aalok ng mga espesyal na panalangin at pasasalamat',
          'Pagtuturo sa mga bata tungkol sa mabilis na pag-alis ng Exodus',
          'Pag-aalis ng tinapay na may lebadura sa buong tahanan',
        ],
        preparation: [
          'Masusing paghahanap ng lebadura sa gabi gamit ang kandila',
          'Sunugin ang lahat ng nahanap na lebadura sa umaga bago magsimula ang pista',
          'Mag-imbak ng matzah para sa buong linggo',
          'Magplano ng pagkain na may gulay, prutas, itlog, karne, at isda',
          'Itakda ang una at ikapitong araw bilang pahinga na katulad ng Shabbat',
        ],
      },
    },
  },
  {
    id: 'firstfruits',
    name: 'Feast of Firstfruits',
    tagalogName: 'Pista ng mga Unang Bunga',
    hebrewName: 'בִּכּוּרִים — Bikkurim',
    hebrewDate: 'Nisan 16–17',
    gregMonth: 'March – April',
    season: 'Spring',
    rank: 'Major',
    reference: 'Leviticus 23:9-14; 1 Corinthians 15:20',
    bibleBook: 'Leviticus',
    bibleChapter: 23,
    image: '/feasts/firstfruits_israel.jpg',
    locationInIsrael: 'Judean Hills & Galilee, Israel',
    color: '#065F46',
    accentDot: '#6EE7B7',
    content: {
      english: {
        description:
          'Firstfruits was celebrated the day after the weekly Sabbath during Unleavened Bread, marking the beginning of the barley harvest. A sheaf of the first grain was waved before the LORD. Paul declares in 1 Corinthians 15:20 that "Christ has been raised from the dead, the firstfruits of those who have fallen asleep" — Yeshua rose on the exact day of this feast!',
        prophecy:
          'Yeshua rose from the dead on the exact morning of Firstfruits, guaranteeing resurrection life for all believers (1 Corinthians 15:20-23).',
        activities: [
          'Waving the omer (sheaf) of barley before the LORD',
          'Bringing grain, lamb, and drink offerings',
          'Beginning of the 49-day Omer count toward Shavuot (Pentecost)',
          'Celebrating the promise of the harvest to come',
          'Reciting Psalm 118 — "This is the day the LORD has made"',
        ],
        preparation: [
          'Select the finest first-cut barley sheaf for the wave offering',
          'Begin the Sefirat HaOmer (counting of the Omer) — mark 49 days daily',
          'Study 1 Corinthians 15 and the resurrection of Messiah',
          'Celebrate with fresh fruits and first produce of the season',
          'Give generously as a firstfruits offering — tithes and financial gifts',
        ],
      },
      tagalog: {
        description:
          'Ang Pista ng mga Pangunahing Bunga ay ipinagdiriwang sa araw pagkatapos ng lingguhang Shabbat sa panahon ng Tinapay na Walang Lebadura, na nagmamarka sa simula ng ani ng sebada. Isang bigkis ng unang butil ang iwinagayway sa harapan ng Panginoon. Ipinahayag ni Pablo sa 1 Corinto 15:20 na "si Kristo ay nabuhay mula sa mga patay, ang pangunahing bunga ng mga natutulog" — Nabuhay si Hesus sa eksaktong araw ng kapistahang ito!',
        prophecy:
          'Nabuhay si Hesus mula sa mga patay sa mismong umaga ng Firstfruits, nagpapatunay ng muling pagkabuhay para sa lahat ng sumasampalataya (1 Corinto 15:20-23).',
        activities: [
          'Pagwawagayway ng omer (bigkis) ng sebada sa harapan ng Panginoon',
          'Pag-aalok ng butil, kordero, at inumin',
          'Simula ng 49-araw na pagbibilang ng Omer patungo sa Shavuot (Pentecostes)',
          'Pagdiriwang ng pangako ng darating na ani',
          'Pagbigkas ng Awit 118 — "Ito ang araw na ginawa ng Panginoon"',
        ],
        preparation: [
          'Pumili ng pinakamagandang unang bigkis para sa alay na pagwawagayway',
          'Simulan ang pagbibilang ng 49 araw ng Omer araw-araw',
          'Pag-aralan ang 1 Corinto 15 at ang muling pagkabuhay ng Mesiyas',
          'Ipagdiwang na may sariwang prutas at unang produkto ng panahon',
          'Magbigay nang bukas-palad bilang unang bunga sa Diyos',
        ],
      },
    },
  },
  {
    id: 'shavuot',
    name: 'Feast of Weeks (Pentecost)',
    tagalogName: 'Shavuot / Pentecostes',
    hebrewName: 'שָׁבוּעוֹת — Shavuot',
    hebrewDate: 'Sivan 6–7',
    gregMonth: 'May – June',
    season: 'Summer',
    rank: 'Major',
    reference: 'Leviticus 23:15-21; Acts 2:1-4',
    bibleBook: 'Acts',
    bibleChapter: 2,
    image: '/feasts/shavuot_israel.jpg',
    locationInIsrael: 'Western Wall (Kotel), Jerusalem, Israel',
    color: '#1D4ED8',
    accentDot: '#93C5FD',
    content: {
      english: {
        description:
          'Shavuot (50 days after Firstfruits) celebrates the wheat harvest and the giving of the Torah at Mount Sinai. Prophetically, it was fulfilled when the Holy Spirit was poured out on the disciples in Jerusalem (Acts 2), exactly 50 days after Messiah\'s resurrection — writing the Law on hearts instead of stone (Jeremiah 31:33; 2 Corinthians 3:3).',
        prophecy:
          'Outpouring of the Holy Spirit on Pentecost at Mount Zion, sealing the New Covenant (Acts 2; Joel 2:28-29; Jeremiah 31:31-34).',
        activities: [
          'All-night Torah study sessions (Tikkun Leil Shavuot)',
          'Reading the Book of Ruth — a story of covenant loyalty, harvest, and redemption',
          'Synagogue and home decorated with flowers, greenery, and wheat sheaves',
          'Eating dairy foods — cheesecake, blintzes, and milk dishes',
          'Celebrating with joyful praise and worship gatherings',
        ],
        preparation: [
          'Complete the 49-day Omer count leading up to this feast day',
          'Prepare traditional dairy meals and fresh bread loaves',
          'Plan a Bible study gathering focusing on the Torah and Acts 2',
          'Decorate with flowers, wheat sheaves, and harvest symbols',
          'Prepare a special financial firstfruits offering to give during worship',
        ],
      },
      tagalog: {
        description:
          'Ang Shavuot (50 araw pagkatapos ng Firstfruits) ay nagdiriwang ng pag-aani ng trigo at pagbibigay ng Torah sa Bundok Sinai. Sa hula, ito ay natupad nang ibuhos ang Espiritu Santo sa mga alagad sa Jerusalem (Gawa 2), eksaktong 50 araw pagkatapos ng muling pagkabuhay ng Mesiyas — pagsulat ng Batas sa puso sa halip na bato (Jeremias 31:33; 2 Corinto 3:3).',
        prophecy:
          'Pagbuhos ng Espiritu Santo sa Pentecostes sa Bundok Sion, nagpapatibay sa Bagong Tipan (Gawa 2; Joel 2:28-29).',
        activities: [
          'Pag-aaral ng Kasulatan buong gabi (Tikkun Leil Shavuot)',
          'Pagbabasa ng Aklat ni Ruth — isang kwento ng katapatan sa tipan at pag-aani',
          'Palamutian ang paligid ng mga bulaklak, halaman, at trigo',
          'Pagkain ng mga pagkaing gawa sa gatas — cheesecake at blintzes',
          'Pagdiriwang na may kagalakan, musika, at panalangin',
        ],
        preparation: [
          'Tapusin ang 49-araw na pagbibilang ng Omer',
          'Maghanda ng espesyal na hapunan na may mga produkto ng gatas',
          'Magplano ng pag-aaral ng Salita ng Diyos tungkol sa Gawa 2',
          'Palamutian ang tahanan ng mga bulaklak at ani',
          'Maghanda ng bukas-palad na handog para sa komunidad',
        ],
      },
    },
  },
  {
    id: 'trumpets',
    name: 'Feast of Trumpets',
    tagalogName: 'Pista ng mga Trumpeta',
    hebrewName: 'יוֹם תְּרוּעָה — Yom Teruah',
    hebrewDate: 'Tishri 1',
    gregMonth: 'September – October',
    season: 'Fall',
    rank: 'Major',
    reference: 'Leviticus 23:23-25; 1 Thessalonians 4:16',
    bibleBook: 'Leviticus',
    bibleChapter: 23,
    image: '/feasts/trumpets_israel.jpg',
    locationInIsrael: 'Mount of Olives, Jerusalem, Israel',
    color: '#7C3AED',
    accentDot: '#C4B5FD',
    content: {
      english: {
        description:
          'Yom Teruah, the "Day of Shouting/Blasting," marks the beginning of the civil new year and opens a ten-day period of repentance (Yamim Noraim — Days of Awe). The shofar (ram\'s horn) is sounded 100 times. Prophetically, many scholars believe this feast foreshadows the return of Messiah with "the trumpet call of God" (1 Thess 4:16; Matthew 24:31; 1 Cor 15:52).',
        prophecy:
          'Foreshadows the resurrection of the righteous and the glorious return of King Messiah at the sound of the Great Shofar (1 Thessalonians 4:16-17; 1 Corinthians 15:51-52).',
        activities: [
          'Blowing the shofar (ram\'s horn) 100 times throughout the day',
          'Attending special prayer and worship services',
          'Eating apples dipped in honey — symbolizing a sweet new year',
          'Greeting "L\'Shanah Tovah Tikatevu!" (May you be inscribed for a good year)',
          'Casting bread into living water (Tashlich) — symbolically casting away sins (Micah 7:19)',
        ],
        preparation: [
          'Practice the four sounds of the shofar: Tekiah, Shevarim, Teruah, Tekiah Gedolah',
          'Prepare honey cakes, apple dishes, and round challah bread',
          'Send New Year blessings and greetings to family and friends',
          'Begin a 10-day period of self-examination, repentance, and prayer',
          'Study and meditate on passages about the second coming of Messiah',
        ],
      },
      tagalog: {
        description:
          'Ang Yom Teruah, ang "Araw ng Pagsisigaw/Pagpapatugtog," ay nagmamarka ng simula ng sibil na bagong taon at nagbubukas ng sampung araw na panahon ng pagsisisi (Yamim Noraim — Mga Araw ng Pangamba). Ang shofar (sungay ng tupa) ay tumutugtog nang 100 beses. Sa hula, maraming iskolar ang naniniwala na ang kapistahang ito ay nagtatanda ng pagbabalik ng Mesiyas na may "tunog ng trumpeta ng Diyos" (1 Tes 4:16).',
        prophecy:
          'Naglalarawan sa muling pagbabalik ng Haring Mesiyas sa tunog ng Dakilang Shofar (1 Tesalonica 4:16-17; 1 Corinto 15:51-52).',
        activities: [
          'Pagtugtog ng shofar (sungay ng tupa) nang 100 beses sa buong araw',
          'Pagdalo sa mga espesyal na serbisyo ng panalangin at pagsamba',
          'Pagkain ng mansanas na may pulot-pukyutan — simbolo ng matamis na bagong taon',
          'Pagbati ng "L\'Shanah Tovah!" (Nawa\'y magkaroon ka ng mabuting taon)',
          'Paghahagis ng tinapay sa tubig (Tashlich) — simbolikong pagtatapon ng kasalanan (Mikas 7:19)',
        ],
        preparation: [
          'Magsanay ng apat na tunog ng shofar: Tekiah, Shevarim, Teruah, Tekiah Gedolah',
          'Maghanda ng honey cake, mga mansanas at pulot-pukyutan, at bilugang tinapay',
          'Magpadala ng mga pagbati para sa Bagong Taon sa pamilya at kaibigan',
          'Magsimula ng 10-araw na panahon ng pagsusuri sa sarili at panalangin',
          'Magnilay sa mga talata tungkol sa ikalawang pagparito ng Mesiyas',
        ],
      },
    },
  },
  {
    id: 'atonement',
    name: 'Day of Atonement',
    tagalogName: 'Araw ng Katubusan',
    hebrewName: 'יוֹם כִּפּוּר — Yom Kippur',
    hebrewDate: 'Tishri 10',
    gregMonth: 'September – October',
    season: 'Fall',
    rank: 'Major',
    reference: 'Leviticus 23:26-32; Hebrews 9:7; Romans 3:25',
    bibleBook: 'Leviticus',
    bibleChapter: 16,
    image: '/feasts/dayofatonement_israel.jpg',
    locationInIsrael: 'Western Wall Plaza, Jerusalem, Israel',
    color: '#DC2626',
    accentDot: '#FCA5A5',
    content: {
      english: {
        description:
          'The holiest day on the Hebrew calendar — a day of fasting, prayer, and deep repentance. The High Priest entered the Holy of Holies once a year to sprinkle blood on the Mercy Seat for the people\'s sins. The "scapegoat" carried Israel\'s sins into the wilderness (Lev 16). Prophetically, Yom Kippur points to Yeshua as the ultimate High Priest whose sacrifice atoned for all sin once and for all (Hebrews 9–10).',
        prophecy:
          'Yeshua entered the Heavenly Holy of Holies with His own blood, obtaining eternal redemption for all humanity (Hebrews 9:11-14; Romans 3:25).',
        activities: [
          'A 25-hour fast from sundown to sundown (abstaining from food and water)',
          'Attending synagogue/church prayer and worship vigils',
          'Reciting the Kol Nidre and confession prayers (Vidui)',
          'Wearing white clothing — symbolizing purity, forgiveness, and the heavenly realm',
          'Spending the day in fasting, prayer, intercession, and reconciliation',
        ],
        preparation: [
          'Seek forgiveness and make amends with anyone you have wronged before sundown',
          'Prepare a pre-fast meal (Seudah Hamafseket) with nourishing, easy-to-digest foods',
          'Charge your heart through the ten Days of Awe with sincere repentance',
          'Read and study Leviticus 16 and Hebrews 8–10',
          'Set aside all work, commerce, and secular entertainment',
        ],
      },
      tagalog: {
        description:
          'Ang pinakasagradong araw sa Hebreong kalendaryo — isang araw ng pag-aayuno, panalangin, at malalim na pagsisisi. Ang Punong Pari ay pumapasok sa Banal ng mga Banal minsan sa isang taon upang magwisik ng dugo sa Upuan ng Awa para sa mga kasalanan ng bayan. Sa hula, ang Yom Kippur ay nagtuturo kay Hesus bilang pinakamataas na Pari na nagbayad ng lahat ng kasalanan magpakailanman (Hebreo 9–10).',
        prophecy:
          'Pumasok si Hesus sa Makalangit na Banal ng mga Banal gamit ang Kanyang sariling dugo para sa walang hanggang katubusan (Hebreo 9:11-14).',
        activities: [
          'Isang 25-oras na pag-aayuno mula sa paglubog ng araw hanggang paglubog ng araw',
          'Pagdalo sa mga serbisyo ng panalangin at pagsisisi',
          'Pagbigkas ng mga panalangin ng pagtatapat ng kasalanan (Vidui)',
          'Pagsuot ng puting damit — simbolo ng kadalisayan at kapatawaran',
          'Paggugol ng buong araw sa panalangin, paghingi ng tawad, at pagkakasundo',
        ],
        preparation: [
          'Humingi ng kapatawaran sa mga nagawan mo ng mali bago magsimula ang pista',
          'Maghanda ng masustansyang pagkain bago ang pag-aayuno',
          'Punuin ang puso ng pagsisisi sa loob ng Sampung Araw ng Pangamba',
          'Basahin at pag-aralan ang Levitico 16 at Hebreo 8–10',
          'Itabi ang lahat ng trabaho at libangan para sa banal na araw',
        ],
      },
    },
  },
  {
    id: 'tabernacles',
    name: 'Feast of Tabernacles',
    tagalogName: 'Pista ng mga Balag / Tabernakulo',
    hebrewName: 'סֻכּוֹת — Sukkot',
    hebrewDate: 'Tishri 15–21',
    gregMonth: 'September – October',
    season: 'Fall',
    rank: 'Major',
    reference: 'Leviticus 23:33-43; Zechariah 14:16; John 7:37-38',
    bibleBook: 'Leviticus',
    bibleChapter: 23,
    image: '/feasts/sukkot_israel.jpg',
    locationInIsrael: 'Jewish Quarter, Jerusalem, Israel',
    color: '#059669',
    accentDot: '#6EE7B7',
    content: {
      english: {
        description:
          'Sukkot is a seven-day harvest festival where Israel dwells in temporary booths (sukkot) to remember the forty years in the wilderness. It is the most joyous feast, called "the Season of Our Joy." Prophetically, many believe Yeshua was born during Sukkot — "the Word became flesh and tabernacled among us" (John 1:14). It also foreshadows the Millennial Kingdom when all nations will celebrate this feast (Zechariah 14:16).',
        prophecy:
          'Points to the dwelling of God with mankind in the Messianic Kingdom and the New Jerusalem (Revelation 21:3; Zechariah 14:16).',
        activities: [
          'Building and dwelling in a sukkah (temporary outdoor booth)',
          'Waving the Four Species (Arba Minim): palm, myrtle, willow (lulav) and citron (etrog)',
          'Nightly rejoicing with music, dancing, and singing (Simchat Beit HaShoevah)',
          'Water drawing ceremony recalling Isaiah 12:3 and John 7:37-38',
          'Joyful communal feasts welcoming family, guests, and strangers (Ushpizin)',
        ],
        preparation: [
          'Build a sukkah (booth) with natural leafy branches for the roof (s\'chach)',
          'Decorate the sukkah with seasonal fruits, drawings, and hanging lights',
          'Obtain the Four Species: lulav branches and fragrant etrog citron',
          'Plan meals to be enjoyed together inside the sukkah under the stars',
          'Invite friends, family, and community members to share festive meals',
        ],
      },
      tagalog: {
        description:
          'Ang Sukkot ay isang pitong araw na kapistahan ng ani kung saan naninirahan ang Israel sa mga pansamantalang kubol (sukkot) bilang pag-alala sa apatnapung taon sa ilang. Ito ang pinaka-masayang kapistahan, tinatawag na "Panahon ng Aming Kagalakan." Sa hula, marami ang naniniwala na si Hesus ay ipinanganak sa panahon ng Sukkot — "ang Salita ay naging laman at nanirahan sa aming piling" (Juan 1:14).',
        prophecy:
          'Nagtuturo sa pananahanan ng Diyos kasama ng mga tao sa Kaharian ng Mesiyas at Bagong Jerusalem (Pahayag 21:3; Zacarias 14:16).',
        activities: [
          'Pagtatayo at paninirahan sa isang sukkah (kubol) sa labas',
          'Pagwawagayway ng Apat na Uri: palma, mirto, willow (lulav) at sitron (etrog)',
          'Mga pagdiriwang sa gabi na may musika, sayawan, at kagalakan',
          'Seremonya ng tubig bilang pag-alala sa Isaias 12:3 at Juan 7:37-38',
          'Masayang pagsasalu-salo kasama ang pamilya at panauhin',
        ],
        preparation: [
          'Magtayo ng kubol na may bubong na gawa sa mga natural na sanga at dahon',
          'Palamutian ang sukkah ng mga prutas at palamuti',
          'Kumuha ng Apat na Uri para sa alay na pagwawagayway',
          'Maghanda ng mga masasarap na pagkain na kakainin sa loob ng sukkah',
          'Mag-imbita ng mga kaibigan at kapatiran upang makibahagi sa kapistahan',
        ],
      },
    },
  },
  {
    id: 'purim',
    name: 'Purim',
    tagalogName: 'Purim',
    hebrewName: 'פּוּרִים — Purim',
    hebrewDate: 'Adar 14–15',
    gregMonth: 'February – March',
    season: 'Winter',
    rank: 'Minor',
    reference: 'Esther 9:20-32',
    bibleBook: 'Esther',
    bibleChapter: 9,
    image: '/feasts/purim_israel.jpg',
    locationInIsrael: 'Machane Yehuda Market, Jerusalem, Israel',
    color: '#DB2777',
    accentDot: '#F9A8D4',
    content: {
      english: {
        description:
          'Purim celebrates the miraculous deliverance of the Jewish people from Haman\'s plot to exterminate them, as recorded in the Book of Esther. Queen Esther courageously went before the king, and Mordecai exposed the plot. Haman and his sons were hanged. The name "Purim" comes from the lots (purim) Haman cast to choose the day of their destruction.',
        prophecy:
          'Celebrates God\'s faithful providence and protection over His covenant people even when His name is concealed.',
        activities: [
          'Public reading (Megillah) of the Book of Esther with joyful noisemakers (groggers)',
          'Wearing festive costumes and masks celebrating the theme of God\'s hidden providence',
          'Sending food gift baskets (Mishloach Manot) to friends and neighbors',
          'Giving charity (Matanot LaEvyonim) to the poor and needy',
          'Joyous festive feast (Seudat Purim) with singing and Hamantaschen pastries',
        ],
        preparation: [
          'Prepare gift baskets with at least two ready-to-eat foods to deliver to friends',
          'Plan costumes for family members representing characters in Esther',
          'Bake or purchase traditional triangular filled cookies (Hamantaschen)',
          'Identify charitable organizations or families to bless with financial gifts',
          'Read through the Book of Esther to remember the courage of Queen Esther',
        ],
      },
      tagalog: {
        description:
          'Ipinagdiriwang ng Purim ang kamangha-manghang pagliligtas ng mga Hudyong tao mula sa plano ni Haman na lipulin sila, ayon sa nakasulat sa Aklat ni Ester. Si Reyna Ester ay matapang na lumabas sa harap ng hari, at inilantad ni Mordecai ang plano. Ang pangalang "Purim" ay nagmumula sa mga palad (purim) na ibinagsak ni Haman.',
        prophecy:
          'Nagdiriwang sa tapat na pagkalinga at pag-iingat ng Diyos sa Kanyang bayan sa lahat ng panahon.',
        activities: [
          'Pampublikong pagbabasa ng Aklat ni Ester na may masayang tunog ng galak',
          'Pagsusuot ng mga kostum at maskara sa pagdiriwang',
          'Pagpapadala ng mga basket ng pagkain (Mishloach Manot) sa mga kaibigan',
          'Pagbibigay ng tulong sa mga mahihirap (Matanot LaEvyonim)',
          'Masayang salu-salo na may mga Hamantaschen na pastry',
        ],
        preparation: [
          'Maghanda ng mga basket ng regalo na may masasarap na pagkain',
          'Magplano ng mga kasuotan para sa pagdiriwang ng pamilya',
          'Magluto o kumuha ng tatsulok na cookies (Hamantaschen)',
          'Maglaan ng tulong at kawanggawa para sa mga nangangailangan',
          'Basahin ang Aklat ni Ester upang sariwain ang tapang ni Reyna Ester',
        ],
      },
    },
  },
  {
    id: 'hanukkah',
    name: 'Hanukkah',
    tagalogName: 'Hanukkah / Pista ng Dedikasyon',
    hebrewName: 'חֲנֻכָּה — Hanukkah',
    hebrewDate: 'Kislev 25 – Tevet 2/3',
    gregMonth: 'November – December',
    season: 'Winter',
    rank: 'Minor',
    reference: '1 Maccabees 4:36-59; John 10:22-23',
    bibleBook: 'John',
    bibleChapter: 10,
    image: '/feasts/hanukkah_israel.jpg',
    locationInIsrael: 'Western Wall (Kotel), Jerusalem, Israel',
    color: '#1E40AF',
    accentDot: '#93C5FD',
    content: {
      english: {
        description:
          'Hanukkah ("Dedication") celebrates the rededication of the Temple in Jerusalem in 165 BCE, after it was desecrated by Antiochus Epiphanes. The miracle of holy oil burning for eight days is commemorated by lighting the Hanukkiah (9-branched menorah). Yeshua was in the Temple during Hanukkah (John 10:22-23), proclaiming Himself as the Shepherd of Israel and the Light of the World.',
        prophecy:
          'Yeshua declared Himself the Light of the World in Jerusalem, illuminating the darkness and rededicating the hearts of believers as temples of the Holy Spirit (John 8:12; 10:22-30; 1 Cor 6:19).',
        activities: [
          'Lighting an additional candle on the Hanukkiah Menorah each of the 8 nights',
          'Placing the Menorah near a window to publicize the miracle (Pirsumei Nisa)',
          'Playing the dreidel spinning game remembering "A Great Miracle Happened There"',
          'Eating olive-oil foods: potato latkes (pancakes) and jelly donuts (sufganiyot)',
          'Giving Hanukkah gelt (coins/gifts) to children and singing songs of praise',
        ],
        preparation: [
          'Set up a 9-branched Hanukkiah Menorah and prepare 44 candles or olive oil wicks',
          'Place the Menorah in a visible window or front doorway',
          'Prepare traditional recipes for potato latkes and jelly donuts',
          'Prepare gifts and chocolate gelt coins for children',
          'Learn the Hanukkah blessings and read John 10:22-38',
        ],
      },
      tagalog: {
        description:
          'Ipinagdiriwang ng Hanukkah ("Dedikasyon") ang muling pagtatalaga ng Templo sa Jerusalem noong 165 BCE. Ang milagro ng banal na langis na nag-apoy nang walong araw ay ipinaggunita sa pamamagitan ng pag-iilaw ng Hanukkiah (9-sanggang menorah). Si Hesus ay nasa Templo sa panahon ng Hanukkah (Juan 10:22-23), ipinapahayag ang Kanyang Sarili bilang Ilaw ng Mundo.',
        prophecy:
          'Ipinahayag ni Hesus na Siya ang Ilaw ng Mundo, nagpapanibago sa puso ng mga sumasampalataya bilang templo ng Espiritu Santo (Juan 8:12; 10:22-30).',
        activities: [
          'Pag-iilaw ng karagdagang kandila sa Hanukkiah bawat gabi sa loob ng 8 araw',
          'Paglalagay ng Menorah sa bintana upang ipahayag ang himala ng Diyos',
          'Paglalaro ng dreidel na nagpapaalala sa dakilang milagro ng Panginoon',
          'Pagkain ng mga pagkaing niluto sa langis tulad ng latkes at sufganiyot',
          'Pagbibigay ng mga regalo sa mga bata at sama-samang pag-awit ng papuri',
        ],
        preparation: [
          'Ihanda ang 9-sanggang Hanukkiah Menorah at mga kandila',
          'Ilagay ang Menorah sa bintana upang makita ng lahat ang liwanag',
          'Maghanda ng mga masasarap na kakanin at pritong pagkain',
          'Maglaan ng munting regalo para sa mga kabataan',
          'Basahin ang Juan 10:22-38 tungkol kay Hesus sa Pista ng Dedikasyon',
        ],
      },
    },
  },
];

const SEASON_FILTERS: Array<{ id: Season; label: string; icon: string }> = [
  { id: 'All', label: 'All Feasts (9)', icon: '✨' },
  { id: 'Spring', label: 'Spring Feasts (3)', icon: '🌸' },
  { id: 'Summer', label: 'Summer / Weeks (1)', icon: '🌾' },
  { id: 'Fall', label: 'Fall Feasts (3)', icon: '🍂' },
  { id: 'Winter', label: 'Historical / Winter (2)', icon: '🕯️' },
];

export default function BiblicalFeastsPage() {
  const router = useRouter();
  const { setCurrentBook, setCurrentChapter } = useApp();

  const [selectedSeason, setSelectedSeason] = useState<Season>('All');
  const [selectedLang, setSelectedLang] = useState<Lang>('english');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeast, setSelectedFeast] = useState<Feast | null>(null);
  const [modalTab, setModalTab] = useState<'description' | 'activities' | 'preparation'>('description');

  // Filter feasts
  const filteredFeasts = useMemo(() => {
    return FEASTS.filter((f) => {
      const matchSeason = selectedSeason === 'All' || f.season === selectedSeason;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchSeason;

      const matchQuery =
        f.name.toLowerCase().includes(q) ||
        (f.tagalogName && f.tagalogName.toLowerCase().includes(q)) ||
        f.hebrewName.toLowerCase().includes(q) ||
        f.reference.toLowerCase().includes(q) ||
        f.content.english.description.toLowerCase().includes(q) ||
        f.content.tagalog.description.toLowerCase().includes(q);

      return matchSeason && matchQuery;
    });
  }, [selectedSeason, searchQuery]);

  const handleOpenBible = (book?: string, chapter?: number) => {
    if (book && chapter) {
      setCurrentBook(book);
      setCurrentChapter(chapter);
    }
    router.push('/bible');
  };

  return (
    <>
      <Head>
        <title>Biblical Feasts (Moedim) | WithGod Bible & Journal</title>
        <meta
          name="description"
          content="Explore the 7 Biblical Appointed Feasts (Moedim) of Leviticus 23 plus Purim and Hanukkah — prophetic significance, scriptures, and customs in English and Tagalog."
        />
      </Head>

      <PageLayout
        title="Biblical Feasts (Moedim)"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Biblical Feasts', href: '/feasts' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white p-6 sm:p-10 shadow-xl border border-stone-800">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                The Appointed Times of the LORD (Leviticus 23)
              </span>
              <span className="text-xs text-stone-400 font-serif italic">
                מוֹעֲדֵי יְהוָה — Mo&apos;adei YHVH
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              The 7 Biblical Feasts & Holy Convocations
            </h1>

            <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-serif">
              Discover God&apos;s prophetic calendar of redemption: from the Spring feasts fulfilled at Messiah&apos;s first coming (Passover, Unleavened Bread, Firstfruits, Pentecost) to the Fall feasts foreshadowing His return (Trumpets, Atonement, Tabernacles).
            </p>

            {/* Language Toggle & Search */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="inline-flex items-center p-1 rounded-xl bg-stone-800/80 border border-stone-700/80">
                <button
                  type="button"
                  onClick={() => setSelectedLang('english')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedLang === 'english'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('tagalog')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedLang === 'tagalog'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  🇵🇭 Tagalog
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search feast, Hebrew name, meaning, or verses..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-stone-800/90 border border-stone-700 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Season Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {SEASON_FILTERS.map((s) => {
            const isSelected = selectedSeason === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSeason(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feasts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeasts.map((feast) => {
            const content = feast.content[selectedLang];
            return (
              <div
                key={feast.id}
                className="group rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-amber-500/40"
              >
                {/* Feast Image Header */}
                <div className="relative h-48 w-full bg-stone-800 overflow-hidden">
                  <img
                    src={feast.image}
                    alt={feast.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md text-white border"
                      style={{
                        backgroundColor: `${feast.color}cc`,
                        borderColor: feast.accentDot,
                      }}
                    >
                      {feast.season} • {feast.rank} Feast
                    </span>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/50 text-stone-200 backdrop-blur-md flex items-center gap-1 border border-white/10">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {feast.hebrewDate}
                    </span>
                  </div>

                  {/* Bottom Image Overlay */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-sm font-serif text-amber-300 block" dir="rtl">
                      {feast.hebrewName}
                    </span>
                    <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                      {selectedLang === 'tagalog' && feast.tagalogName ? feast.tagalogName : feast.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Location & Gregorian Timing */}
                    <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800 pb-2.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {feast.gregMonth}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{feast.locationInIsrael}</span>
                      </span>
                    </div>

                    {/* Summary Description */}
                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed font-sans">
                      {content.description}
                    </p>

                    {/* Scripture Reference Link */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenBible(feast.bibleBook, feast.bibleChapter)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{feast.reference}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFeast(feast);
                        setModalTab('description');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 text-stone-800 dark:text-stone-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group-hover:bg-amber-500 group-hover:text-white"
                    >
                      <span>Explore Feast & Customs</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feast Detail Modal */}
      {selectedFeast && (
        <Modal
          isOpen={!!selectedFeast}
          onClose={() => setSelectedFeast(null)}
          title={
            selectedLang === 'tagalog' && selectedFeast.tagalogName
              ? `${selectedFeast.tagalogName} (${selectedFeast.name})`
              : selectedFeast.name
          }
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Modal Hero Banner */}
            <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-stone-900">
              <img
                src={selectedFeast.image}
                alt={selectedFeast.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white border"
                  style={{
                    backgroundColor: `${selectedFeast.color}ee`,
                    borderColor: selectedFeast.accentDot,
                  }}
                >
                  {selectedFeast.season} • {selectedFeast.rank} Feast
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-stone-200 border border-white/10">
                  {selectedFeast.hebrewDate} ({selectedFeast.gregMonth})
                </span>
              </div>

              <div className="absolute bottom-4 left-5 right-5">
                <span className="text-lg font-serif text-amber-300 block" dir="rtl">
                  {selectedFeast.hebrewName}
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  {selectedLang === 'tagalog' && selectedFeast.tagalogName
                    ? selectedFeast.tagalogName
                    : selectedFeast.name}
                </h2>
                <p className="text-xs text-stone-300 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {selectedFeast.locationInIsrael}
                </p>
              </div>
            </div>

            {/* Language Switcher in Modal */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab('description')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    modalTab === 'description'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Meaning & Prophecy
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('activities')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    modalTab === 'activities'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Customs & Seder
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('preparation')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    modalTab === 'preparation'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Preparation Guide
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedLang('english')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md ${
                    selectedLang === 'english'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'text-stone-400'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('tagalog')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md ${
                    selectedLang === 'tagalog'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'text-stone-400'
                  }`}
                >
                  TL
                </button>
              </div>
            </div>

            {/* Modal Tab Content */}
            {modalTab === 'description' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Biblical Narrative & Meaning
                  </h4>
                  <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-serif">
                    {selectedFeast.content[selectedLang].description}
                  </p>
                </div>

                {selectedFeast.content[selectedLang].prophecy && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Prophetic Fulfillment in Messiah Yeshua
                    </h4>
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedFeast.content[selectedLang].prophecy}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block">
                      Scripture Readings
                    </span>
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {selectedFeast.reference}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFeast(null);
                      handleOpenBible(selectedFeast.bibleBook, selectedFeast.bibleChapter);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Read in Bible</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {modalTab === 'activities' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                  <ListChecks className="w-3.5 h-3.5" />
                  Liturgical Customs & Celebration Activities
                </h4>
                <div className="space-y-2.5">
                  {selectedFeast.content[selectedLang].activities.map((act, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                        {act}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalTab === 'preparation' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Home & Spiritual Preparation Steps
                </h4>
                <div className="space-y-2.5">
                  {selectedFeast.content[selectedLang].preparation.map((prep, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                        {prep}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
