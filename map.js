import { getBoundingRect } from 'wix-window-frontend';

const MAP_HEIGHT = 480;

const LOCATIONS = [
  { venue: 'Old North Church',             exhibits: 'Youth & Student Art Exhibit',                                  address: '35 Washington St',   lat: 42.507228518720595, lng: -70.84797444567563},
  { venue: 'Unitarian Universalist Church', exhibits: 'Senior Art Exhibit, Drawing Exhibit',                        address: '28 Mugford St',       lat: 42.50580768494113, lng: -70.851130676796 },
  { venue: "St Michael's Episcopal Church", exhibits: 'Sculpture Exhibit, Mixed Media Exhibit, Digital Art Exhibit', address: '26 Pleasant St',      lat: 42.50444842645364, lng: -70.8510762695344 },
  { venue: 'Abbot Hall',                   exhibits: 'Printmaking Exhibit, Painting Exhibit, Crafts Exhibit',       address: '188 Washington St',   lat: 42.50264858996474, lng: -70.85236538294131 },
  { venue: 'Old Town House',               exhibits: 'Photography Exhibit',                                         address: 'Town House Square',   lat: 42.50533616192688, lng: -70.84964287538085 },
  { venue: 'Robert "King" Hooper Mansion', exhibits: 'Painting the Town Exhibit',                                   address: '98 Hooper St',        lat: 42.50331197608756, lng: -70.8504824676406 },
];
$w.onReady(async function () {
  const { window: { width } } = await getBoundingRect();
  $w('#mapHtml').width = width;
  $w('#mapHtml').height = MAP_HEIGHT;

  $w('#mapHtml').onMessage(e => {
    if (e.data?.type === 'IFRAME_READY') {
      $w('#mapHtml').postMessage({ type: 'LOAD_LOCATIONS', locations: LOCATIONS });
    }
  });
});
