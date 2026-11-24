"""Builds supabase/seed.sql from the trip plan (programme + to-do list).
Run: python3 scripts/build_seed.py"""
import os

A = 'activite'
T = 'tache'

def act(day, start, cat, title, summary=None, **kw):
    return dict(kind=A, day=f'2027-05-{day:02d}', start_time=start, category=cat, title=title, summary=summary, **kw)

def task(cat, title, need, status='a_faire', **kw):
    return dict(kind=T, category=cat, title=title, need_date=need, status=status, **kw)

ITEMS = [
    # ---------- J1 · Wed 12 May ----------
    act(12, '11:30', 'Déplacement', 'Départ vers l’aéroport', 'Voiture commune depuis Franconville, environ 1 h',
        location='Franconville → Paris-CDG', details='70 km, compter 1 h. Déjeuner avant le départ.'),
    act(12, '12:00', 'Aéroport', 'Dépose de la voiture au parking', 'Airport Park Roissy, navette d’environ 7 min',
        location='Airport Park Roissy', link='https://www.allopark.com/fr-fr/rechercher',
        price_amount=122, price_note='Parking réservé'),
    act(12, '12:20', 'Aéroport', 'Arrivée à l’aéroport Paris-CDG', 'Dépose bagages de 11:25 à 13:25',
        location='Paris-CDG', details='Dépose bagages : ouvre à 11:25, ferme à 13:25.\nTerminal indiqué : T4 (à vérifier sur la carte d’embarquement).'),
    act(12, '14:25', 'Vol', 'Vol easyJet EZY3242 Paris → Édimbourg', 'Atterrissage à 15:15, heure locale',
        location='CDG → EDI', end_time='15:15', link='https://www.easyjet.com/fr',
        details='Décollage 14:25, atterrissage 15:15 (heure locale, une heure de moins qu’en France).\nBagages : 2 bagages en soute de 15 kg.\nEnregistrement en ligne ouvert à partir du 12/04/2027 à 14:25.'),
    act(12, '15:15', 'Aéroport', 'Arrivée à Édimbourg', 'Bagages et formalités, compter 45 min', location='Aéroport d’Édimbourg'),
    act(12, '16:00', 'Voiture', 'Récupération de la voiture de location', 'Agence Keddy à l’aéroport',
        location='Aéroport d’Édimbourg', link='https://cars.booking.com',
        details='Deux conducteurs déclarés. Carte de crédit au nom du conducteur principal.',
        price_amount=401.73, price_note='Location 5 jours + assurance'),
    act(12, '16:15', 'Déplacement', 'Route vers Dunkeld', '85 km, environ 1 h 05', location='Édimbourg → Dunkeld'),
    act(12, '17:20', 'Visite', 'Promenade à The Hermitage', 'Forêt de douglas et cascade de Black Linn', location='Dunkeld',
        details='Sentier le long de la rivière Braan jusqu’aux Black Linn Falls et Ossian’s Hall.'),
    act(12, '18:00', 'Déplacement', 'Route panoramique vers Pitlochry', 'Par Glenalmond et Aberfeldy',
        location='Dunkeld → Pitlochry', details='60 km. Arrêt possible à la distillerie Dewar’s d’Aberfeldy (vérifier l’horaire de fermeture).'),
    act(12, '18:30', 'Hôtel', 'Check-in à l’Atholl Palace', 'Une nuit · arrivée prévue 18:00–19:00',
        location='Pitlochry', address='Perth Rd, Pitlochry PH16 5LX, Royaume-Uni', phone='+44 1796 472400',
        details='Check-in de 15:30 à 23:00. Heure d’arrivée demandée : 18:00–19:00.\nCheck-out de 07:30 à 11:00.\n2 chambres doubles, petits-déjeuners compris.',
        booking_ref='6203437735', private_note='Code confidentiel : 4366. Infos supplémentaires dans l’appli Booking.',
        price_amount=681, price_note='Environ 681 € (569,80 £)'),
    act(12, '19:15', 'Hôtel', 'Spa, piscine et bar', 'Massage possible', location='Atholl Palace',
        link='https://www.athollpalace.com/spa/'),
    act(12, '20:30', 'Restaurant', 'Dîner au Fern Cottage', None, location='Pitlochry'),

    # ---------- J2 · Thu 13 May ----------
    act(13, '08:00', 'Restaurant', 'Petit-déjeuner', None, location='Atholl Palace'),
    act(13, '09:00', 'Hôtel', 'Check-out de l’Atholl Palace', 'Check-out de 07:30 à 11:00', location='Pitlochry'),
    act(13, '09:15', 'Déplacement', 'Route A9 par le col de Drumochter', '50 km, 45 min · col à 462 m', location='Pitlochry → Dalwhinnie'),
    act(13, '10:00', 'Visite', 'Distillerie Dalwhinnie', 'Accords whisky & chocolat', location='Dalwhinnie',
        details='Whisky & Chocolate Tasting, 30 min : quatre single malts Dalwhinnie, chacun associé à un chocolat du Highland Chocolatier, et un petit verre à emporter.\nLa visite de la distillerie n’est pas comprise.\nDéjeuner léger sur place ou à Aviemore.',
        price_amount=67, price_note='14 £ par personne, 56 £ pour 4 (environ 67 €)'),
    act(13, '11:00', 'Déplacement', 'Route vers Grantown-on-Spey', 'Environ 1 h 10', location='Dalwhinnie → Grantown-on-Spey'),
    act(13, '12:15', 'Restaurant', 'Déjeuner au Craig Bar', 'Pub de village, repas rapide', location='Grantown-on-Spey',
        details='Solution de repli : The Royal Fish Bar.'),
    act(13, '13:00', 'Déplacement', 'Route par la vallée de la Spey (A95)', '105 km, environ 40 min', location='Grantown-on-Spey → Aberlour'),
    act(13, '14:00', 'Visite', 'Distillerie Cardhu', 'Le cœur de Johnnie Walker', location='Knockando',
        details='Drams disponibles à emporter pour le conducteur.'),
    act(13, '15:00', 'Déplacement', 'Route vers Aberlour', '5 km, 15 min', location='Cardhu → Aberlour'),
    act(13, '15:15', 'Visite', 'Distillerie Aberlour', 'Dégustation au fût', location='Aberlour',
        link='https://www.maltwhiskydistilleries.com/aberlour/tours',
        details='Uniquement la dégustation, pas la visite.\nFormule Casks & Character, 45 min.',
        price_amount=190, price_note='40 £ par personne, 160 £ pour 4 (environ 190 €)'),
    act(13, '16:00', 'Déplacement', 'Route vers l’hôtel', '5 km, 20 min', location='Aberlour → Craigellachie'),
    act(13, '17:00', 'Hôtel', 'Check-in au Craigellachie Hotel', 'Deux nuits · check-in de 15:00 à 23:00', location='Craigellachie',
        details='Deux nuits, petits-déjeuners compris.', price_amount=1262, price_note='2 chambres, réduction Genius'),
    act(13, '18:00', 'Bar', 'Dégustation au Quaich Bar', 'Commentée par le Whisky Manager', location='Craigellachie Hotel',
        link='https://craigellachiehotel.com/whisky-tastings-private-dinners/',
        details='Près de 1 000 whiskies. Tasting privée pour 4 à demander à l’avance : reservations@craigellachiehotel.co.uk'),
    act(13, '20:00', 'Restaurant', 'Dîner au Spey Inn', 'Le pub de l’hôtel', location='Craigellachie Hotel',
        details='Haddock, venaison, haggis… Sinon, second restaurant dans l’hôtel.'),

    # ---------- J3 · Fri 14 May ----------
    act(14, '08:30', 'Restaurant', 'Petit-déjeuner', None, location='Craigellachie Hotel'),
    act(14, '10:10', 'Taxi', 'Taxi vers Glenfiddich', '5 à 10 min', location='Craigellachie → Dufftown',
        price_amount=47.85),
    act(14, '10:30', 'Visite', 'Distillerie Glenfiddich', 'Explorer Tour, 90 min', location='Dufftown',
        details='Visite guidée suivie d’une dégustation de quatre whiskies. Balvenie est juste à côté.',
        price_amount=143, price_note='30 £ par personne, 120 £ pour 4 (environ 143 €)'),
    act(14, '12:30', 'Restaurant', 'Déjeuner au Sidings Café', 'Dans un ancien train', location='Dufftown',
        details='Attention : fermé temporairement, à revérifier.\nPlan B : déjeuner au Spey Inn.'),
    act(14, '14:00', 'Visite', 'Temps libre', 'Speyside Way et pont de Telford (1814)', location='Dufftown → Craigellachie',
        details='Balade, ou sieste avant la soirée !'),
    act(14, '15:30', 'Taxi', 'Taxi vers The Macallan', '10 à 15 min', location='Craigellachie → Macallan Estate', price_amount=41.87),
    act(14, '16:00', 'Restaurant', 'Macallan Mastery Experience', 'Dîner gastronomique, whiskies inclus · 5 h', location='Macallan Estate',
        details='Dram de bienvenue au Whisky Wall, dîner à TimeSpirit (six plats avec accords Macallan et xérès Valdespino), visite de la production et dégustation guidée au Macallan Bar.\nTenue un peu plus chic.',
        price_amount=1196, price_note='250 £ par personne, 1 000 £ pour 4'),
    act(14, '21:15', 'Taxi', 'Taxi retour à l’hôtel', '10 à 15 min', location='Macallan → Craigellachie', price_amount=17.94),
    act(14, '21:30', 'Bar', 'Dernier dram au Quaich Bar', None, location='Craigellachie Hotel'),

    # ---------- J4 · Sat 15 May ----------
    act(15, '09:00', 'Restaurant', 'Petit-déjeuner', None, location='Craigellachie Hotel'),
    act(15, '10:00', 'Hôtel', 'Check-out du Craigellachie Hotel', 'Avant 11:00', location='Craigellachie'),
    act(15, '10:10', 'Déplacement', 'Route vers GlenDronach', '45 km, environ 50 min', location='Craigellachie → Forgue'),
    act(15, '11:00', 'Visite', 'Distillerie GlenDronach', 'Le règne du xérès', location='Forgue',
        details='Valley of the Brambles : visite de la distillerie et du chai traditionnel. Compter 1 h 30 à 2 h 30.',
        price_amount=119, price_note='25 £ par personne, 100 £ pour 4 (environ 119 €)'),
    act(15, '12:00', 'Déplacement', 'Route vers le Brae Café', 'Environ 1 h 15', location='Forgue → Brae Café'),
    act(15, '13:15', 'Restaurant', 'Déjeuner au Brae Café', 'Ouvert de 10:00 à 15:00'),
    act(15, '14:15', 'Déplacement', 'Route vers Fettercairn', '15 min'),
    act(15, '14:30', 'Visite', 'Distillerie Fettercairn', 'La maison à la licorne', location='Fettercairn',
        details='A Taste of Fettercairn : trois dégustations, environ 1 h 15.',
        price_amount=287.08, price_note='20 £ par personne pour A Taste of Fettercairn'),
    act(15, '16:30', 'Déplacement', 'Route vers Edzell', '10 min', location='Fettercairn → Edzell'),
    act(15, '16:45', 'Hôtel', 'Check-in au Glenesk Hotel', 'Une nuit · check-in de 14:00 à 22:00', location='Edzell',
        phone='+44 1356 647333', details='Petits-déjeuners compris.',
        booking_ref='5383030061', private_note='Code confidentiel : 7518.',
        price_amount=423, price_currency='£', price_note='Payé'),
    act(15, '17:00', 'Hôtel', 'Piscine, sauna et salons à cheminée', None, location='Glenesk Hotel'),
    act(15, '18:00', 'Bar', 'Malt Lounge', 'Plus de 800 bouteilles', location='Glenesk Hotel'),
    act(15, '20:00', 'Restaurant', 'Dîner au Fairways Brasserie', 'Le restaurant de l’hôtel', location='Glenesk Hotel'),

    # ---------- J5 · Sun 16 May ----------
    act(16, '09:00', 'Restaurant', 'Petit-déjeuner', None, location='Glenesk Hotel'),
    act(16, '10:00', 'Hôtel', 'Check-out du Glenesk Hotel', 'Avant 11:00', location='Edzell'),
    act(16, '10:15', 'Déplacement', 'Route vers Édimbourg', 'Par l’A90 et Perth · 125 km, environ 2 h 20', location='Edzell → Édimbourg'),
    act(16, '12:30', 'Restaurant', 'Déjeuner à Édimbourg', 'Fruits de mer à Leith ou bistrot du Grassmarket', location='Édimbourg'),
    act(16, '14:00', 'Visite', 'Johnnie Walker Princes Street', 'Journey of Flavour et rooftop avec vue sur le château', location='Princes Street, Édimbourg'),
    act(16, '17:30', 'Voiture', 'Plein et restitution de la voiture', 'Agence Keddy, aéroport d’Édimbourg', location='Aéroport d’Édimbourg'),
    act(16, '18:40', 'Aéroport', 'Dépose des bagages', 'Ouvre à 18:40, ferme à 20:20', location='Aéroport d’Édimbourg'),
    act(16, '21:10', 'Vol', 'Vol easyJet EJU4692 Édimbourg → Paris', 'Atterrissage à 00:05 à Paris-CDG',
        location='EDI → CDG', link='https://www.easyjet.com/fr',
        details='Décollage 21:10, atterrissage 00:05 (heure de Paris).\nBagages : 2 bagages en soute de 15 kg, le whisky voyage en soute.\nPuis navette (environ 7 min) et récupération de la voiture au parking.'),

    # ---------- preparation tasks ----------
    task('Administratif', 'ETA pour chacun', '2027-05-12', summary='Autorisation de voyage électronique, environ 20 £ par personne',
         link='https://www.gov.uk/eta', guest_visible=True, due_date='2027-04-12', remind_offsets=[30, 7, 1],
         details='Démarche officielle : appli « UK ETA » ou gov.uk. Réponse en général sous 3 jours ouvrés, valable 2 ans.\nAttention : serviceevisa.com est un intermédiaire payant.'),
    task('Administratif', 'Pré-enregistrement', '2027-05-12', due_date='2027-05-10', due_time='14:25', due_note='H-48 départ',
         link='https://www.easyjet.com/fr', remind_offsets=[1, 0], details='Enregistrement en ligne ouvert à partir du 12/04/2027 à 14:25.'),
    task('Administratif', 'Conversion € > £', '2027-05-12'),
    task('Avion', 'Achat des billets d’avion (dont 1 bagage soute 20 kg)', '2027-05-12', due_note='ASAP', price_amount=624,
         price_note='146 € par personne + bagage'),
    task('Voiture', 'Réserver voiture (déclarer 2 conducteurs)', '2027-05-12', status='termine', link='https://cars.booking.com', price_amount=401.73),
    task('Voiture', 'Réserver parking CDG', '2027-05-12', status='termine', link='https://www.allopark.com/fr-fr/rechercher', price_amount=122),
    task('Hôtel', 'Réserver Atholl Palace', '2027-05-12', status='termine', booking_ref='6203437735', price_amount=681),
    task('Hôtel', 'Réserver Craigellachie Hotel', '2027-05-13', status='termine', price_amount=1262),
    task('Hôtel', 'Réserver Glenesk Hotel', '2027-05-15', status='termine', booking_ref='5383030061', price_amount=423, price_currency='£'),
    task('Restaurant', 'Réserver Fern Cottage', '2027-05-12'),
    task('Visite', 'Réserver Distillerie Dalwhinnie', '2027-05-13', price_amount=67),
    task('Restaurant', 'Réserver Craig Bar', '2027-05-13', due_note='Optionnel'),
    task('Visite', 'Réserver Cardhu', '2027-05-13'),
    task('Visite', 'Réserver Distillerie Aberlour', '2027-05-13', price_amount=190),
    task('Restaurant', 'Réserver Spey Inn', '2027-05-13'),
    task('Taxi', 'Réserver trajet Craigellachie → Glenfiddich', '2027-05-14', price_amount=47.85),
    task('Visite', 'Réserver distillerie Glenfiddich', '2027-05-14', due_date='2027-02-15', due_note='Ouverture résa mi-février',
         remind_offsets=[7, 1, 0], price_amount=143),
    task('Restaurant', 'Réserver Sidings Café', '2027-05-14', due_note='Optionnel'),
    task('Taxi', 'Réserver trajet Dufftown → Macallan', '2027-05-14', price_amount=41.87),
    task('Visite', 'Réserver Macallan Mastery Experience', '2027-05-14', due_date='2026-12-01', due_time='08:00',
         due_note='Ouverture des réservations', remind_offsets=[7, 3, 1, 0], price_amount=1196),
    task('Taxi', 'Réserver trajet Macallan → Craigellachie', '2027-05-14', price_amount=17.94),
    task('Visite', 'Réserver distillerie GlenDronach', '2027-05-15', price_amount=119),
    task('Restaurant', 'Réserver Brae Café', '2027-05-15', due_note='Optionnel'),
    task('Visite', 'Réserver distillerie Fettercairn', '2027-05-15', price_amount=287.08),
    task('Restaurant', 'Réserver Fairways Brasserie (restaurant du Glenesk)', '2027-05-15', due_note='Optionnel'),
]

COLS = ['kind', 'category', 'title', 'summary', 'details', 'day', 'start_time', 'end_time', 'location', 'address', 'phone',
        'link', 'due_date', 'due_time', 'due_note', 'need_date', 'remind_offsets', 'status', 'price_amount', 'price_currency',
        'price_note', 'booking_ref', 'private_note', 'guest_visible', 'sort']

def q(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, list):
        return "'{" + ','.join(str(x) for x in v) + "}'"
    return "'" + str(v).replace("'", "''") + "'"

rows = []
for i, it in enumerate(ITEMS):
    it = dict(it)
    it.setdefault('sort', i)
    if it['kind'] == T:
        it.setdefault('guest_visible', False)
        if it.get('due_date') and 'remind_offsets' not in it:
            it['remind_offsets'] = [7, 1, 0]
    it.setdefault('remind_offsets', [])
    it.setdefault('status', 'a_faire')
    it.setdefault('guest_visible', True)
    it.setdefault('price_currency', '€' if it.get('price_amount') is not None else None)
    unknown = set(it) - set(COLS)
    assert not unknown, unknown
    rows.append('(' + ', '.join(q(it.get(c)) for c in COLS) + ')')

sql = ('-- Trip data: programme (12–16 May 2027) and preparation tasks.\n'
       '-- Run after schema.sql, once. Re-running adds duplicates.\n'
       f'insert into items ({", ".join(COLS)}) values\n' + ',\n'.join(rows) + ';\n')
out = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'seed.sql')
open(out, 'w').write(sql)
print(len(ITEMS), 'items written')
