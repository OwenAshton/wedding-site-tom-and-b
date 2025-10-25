import { Status, Wrapper } from "@googlemaps/react-wrapper";
import MapComponent from "../Map/MapComponent";
import ErrorComponent from "../SiteUtilities/ErrorComponent";
import "./TheDay.css";
import Schedule from "../Schedule/Schedule";
import Marker from "../Map/MarkerComponent";
const theDayIcon = "icons/generalSections/005-wedding-day.png";
const dressCodeIcon = "icons/generalSections/014-tuxedo.png";
const googleIcon = "icons/generalSections/001-wedding.png";
const photoIcon = "icons/generalSections/002-camera.png";
const venueNotesIcon = "icons/generalSections/012-house.png";
const churchIcon = "icons/scheduleIcons/002-church.png";
const accommodationIcon = "icons/generalSections/010-bed.png";
const trainStationIcon = "icons/generalSections/008-subway.png";

const dayIntroText1 =
	"We encourage all of our guests to arrive at the church and look to be seated around 1:30pm. Please see Transport section for further information on coach transfer option to the ceremony.";
const dressCodeText = "As it’s Christmas week it’s a great excuse for getting dressed up and plenty of sparkles! We would just recommend bringing a warm coat for the church and an umbrella in case of bad weather."
const photosText = "We’ve booked a photographer for our ceremony but encourage our guests to snap away during the reception. There will also be a photobooth available at the venue for capturing funny moments. Following the wedding we will be providing further information on how you can share your snaps of the day with us and other wedding guests."
const venueNotes1 = "Please note confetti is not permitted at the Curradine Barns but is fine for the church. Biodegradable confetti will be made available to guests at the ceremony."
const venueNotes2 = "A cloakroom will be available at the reception venue for storing coats and umbrellas."
const venueNotes3 = "Please note the bar at the Curradine Barns is cashless, cards only please."
const venueNotes4 = "We are sorry but due to the nature of our venue we are unable to extend the invitation to children."
const churchPosition = { lat: 52.193816460870806, lng: -2.360040368140079 };
const vineyardsPosition = { lat: 52.2049103706618, lng: -2.3669649207219026 };
const talbotPosition = { lat: 52.20218901164186, lng: -2.391790761645229 };
const curradinePosition = { lat: 52.2803323320721, lng: -2.287928864417954 };
const dewDropPosition = { lat: 52.20608736011157, lng: -2.282077364417954 };
const premierInnWorcesterPosition = { lat: 52.19018696519726, lng: -2.226280693253862 };
const manorArmsPubPosition = { lat: 52.30844793423735, lng: -2.363492806746138 };
const forgateTrainStationPosition = { lat: 52.195119622093976, lng: -2.2216972113034488 }
const infoWindowContentStart ="<div id='content'><h4 id='firstHeading' class='firstHeading'>";
const curradineInfoContent = "Curradine Barns</h4><div><a href='https://goo.gl/maps/RgjnQbUEtNstyk1J9'>Open in google maps</a></div>";
const churchInfoContent = "Church of St Mary Magdalene</h4><div><a href='https://goo.gl/maps/oqYjC7Lu14AJXvJt7'>Open in google maps</a></div>";
const vineyardsInfoContent = "The Vineyards</h4><div><a href='https://goo.gl/maps/H4HkRnsEYgiUoFNn9'>Open in google maps</a></div>";
const talbotInfoContent = "The Talbot at Knightwick</h4><div><a href='https://g.page/talbotknightwick?share'>Open in google maps</a></div>";
const dewDropInfoContent = "The Dewdrop Inn</h4><div><a href='https://goo.gl/maps/eZaEPePwutPWYoZJ9'>Open in google maps</a></div>"
const premierInnWorcesterInfoContent = "Premier Inn Worcester City Centre hotel</h4><div><a href='https://goo.gl/maps/fnDQz2hkU3eBi9Po9'>Open in google maps</a></div>"
const manorArmsPubInfoContent = "The Manor Arms Pub</h4><div><a href='https://g.page/themanorarmsabberley?share'>Open in google maps</a></div>"
const forgateTrainStationInfoContent = "Worcester Foregate Street Train Station</h4><div><a href='https://goo.gl/maps/hXev6q1ffTCubgbm6'>Open in google maps</a></div>"
const infoWindowContentEnd ="</div>"

const TheDay = ({ id, googleApiKey }) => {
	const renderGoogleMap = (status) => {
		switch (status) {
			case Status.LOADING:
				return <div>Loading...</div>;
			case Status.FAILURE:
				return (
					<ErrorComponent errorMessage="Oh no! something went wrong with the google Api. Maybe google is down! The Horror!" />
				);
			case Status.SUCCESS:
				return <div>Map Currently Disabled. Need to set up new Google Maps project for Tom & B</div>
				// return <MapComponent />;
		}
	};

	const createStyledInfoWindowContent = (content:string) => {
		return infoWindowContentStart + content + infoWindowContentEnd;
	}

	return (
		<div id={id} className="section-block">
			<h3 className="section-title">The Day</h3>
			<div className="section-content">
				<img className="section-icon" src={theDayIcon}></img>
				<div className="the-day-text-section">
					<p className="the-day-text">{dayIntroText1}</p>
					<p className="the-day-text">Following the ceremony a black-tie reception is to be held at the Curradine Barns, Shrawley - a 15-20 minute drive from the church of St Mary Magdalene. Guests will be welcomed with cocktails and canap&eacute;s from 3.30pm.</p>
				</div>
			</div>
			<div className="section-content">
				<Schedule/>
			</div>
			<div className="section-content">
			<img className="section-icon" src={dressCodeIcon}></img>
				<div className="the-day-text-section">
					<h4><strong>Dress Code - Black tie</strong></h4>
					<p className="the-day-text">{dressCodeText}</p>
				</div>
			</div>
			<div className="section-content">
			<img className="section-icon" src={photoIcon}></img>
				<div className="the-day-text-section">
				<h4><strong>Photographs</strong></h4>
				<p className="the-day-text">{photosText}</p>
				</div>
			</div>
			<div className="section-content">
			<img className="section-icon" src={venueNotesIcon}></img>
				<div className="the-day-text-section">
				<h4><strong>Venue Notes</strong></h4>
				<p className="the-day-text">{venueNotes1}</p>
				<p className="the-day-text">{venueNotes2}</p>
				<p className="the-day-text">{venueNotes3}</p>
				<p className="the-day-text">{venueNotes4}</p>

				</div>
			</div>
			<div className="google-content">
				<div className="google-title-content">
					<img className="google-icon" src={googleIcon}></img>
					<h4 className="google-title"><strong>Location</strong></h4>
				</div>
				<Wrapper apiKey={googleApiKey} render={renderGoogleMap}>
					<MapComponent>
						<Marker options={
							{
								position:churchPosition,  
								icon:{
								url: churchIcon,
								scaledSize: {height: 32,  width:32}
								}
							}}  infoWindowContent={churchInfoContent}/>
							<Marker options={{position:forgateTrainStationPosition, icon:{
								url: trainStationIcon,
								scaledSize: {height: 32,  width:32}
								}}} infoWindowContent={createStyledInfoWindowContent(forgateTrainStationInfoContent)} />
							<Marker options={{position:curradinePosition, icon:{
								url: venueNotesIcon,
								scaledSize: {height: 32,  width:32}
								}}} infoWindowContent={createStyledInfoWindowContent(curradineInfoContent)} />
							<Marker options={{position:vineyardsPosition, icon:{
								url: accommodationIcon,
								scaledSize: {height: 32,  width:32}
								}}} infoWindowContent={createStyledInfoWindowContent(vineyardsInfoContent)}/>
							<Marker options={{position:talbotPosition, icon:{
								url: venueNotesIcon,
								scaledSize: {height: 32,  width:32}
								}}} infoWindowContent={createStyledInfoWindowContent(talbotInfoContent)}/>
							<Marker options={{position:dewDropPosition, icon:{
								url: accommodationIcon,
								scaledSize: {height: 32,  width:32}
								}}} infoWindowContent={createStyledInfoWindowContent(dewDropInfoContent)}/>
							<Marker options={{position:premierInnWorcesterPosition, icon:{
								url: accommodationIcon,
								scaledSize: {height: 32,  width:32}
								}}} infoWindowContent={createStyledInfoWindowContent(premierInnWorcesterInfoContent)}/>
							<Marker options={{position:manorArmsPubPosition, icon:{
								url: accommodationIcon,
								scaledSize: {height: 32,  width:32}
								}}} infoWindowContent={createStyledInfoWindowContent(manorArmsPubInfoContent)}/>
					</MapComponent>
				</Wrapper>
			</div>
			
		</div>
	);
};

export default TheDay;
