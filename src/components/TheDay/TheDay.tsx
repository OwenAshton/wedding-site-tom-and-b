import { Status, Wrapper } from "@googlemaps/react-wrapper";
import MapComponent from "../Map/MapComponent";
import ErrorComponent from "../SiteUtilities/ErrorComponent";
import "./TheDay.css";
import Marker from "../Map/MarkerComponent";
const venueIcon = "icons/generalSections/012-house.png";
const directionsIcon = "icons/generalSections/008-subway.png";
const accommodationIcon = "icons/generalSections/010-bed.png";
const mapIcon = "icons/generalSections/001-wedding.png";

const klondykePosition = { lat: 53.4436, lng: -2.1963 };
const levenshulmeStationPosition = { lat: 53.4449, lng: -2.1930 };

const infoWindowContentStart = "<div id='content'><h4 id='firstHeading' class='firstHeading'>";
const infoWindowContentEnd = "</div>";

const klondykeInfoContent = "The Klondyke</h4><div><a href='https://maps.google.com/?q=The+Klondyke+Levenshulme+Manchester'>Open in Google Maps</a></div>";
const levenshulmeStationInfoContent = "Levenshulme Train Station</h4><div><a href='https://maps.google.com/?q=Levenshulme+Train+Station+Manchester'>Open in Google Maps</a></div>";

const TheDay = ({ id, googleApiKey }) => {
	const renderGoogleMap = (status) => {
		switch (status) {
			case Status.LOADING:
				return <div>Loading...</div>;
			case Status.FAILURE:
				return (
					<ErrorComponent errorMessage="Oh no! Something went wrong with the Google API." />
				);
			case Status.SUCCESS:
				return <div>Map Currently Disabled. Need to set up new Google Maps project for Tom & B</div>;
		}
	};

	const createStyledInfoWindowContent = (content: string) => {
		return infoWindowContentStart + content + infoWindowContentEnd;
	};

	return (
		<div id={id} className="section-block">
			<h3 className="section-title">Venue / Directions / Places to Stay</h3>

			{/* Venue Information */}
			<div className="section-content">
				<img className="section-icon" src={venueIcon} />
				<div className="the-day-text-section">
					<h4><strong>Venue</strong></h4>
					<p className="the-day-text">
						The Klondyke is a traditional social and bowling club which has been updated over the years but still retains the charm and historic character of an old school boozer. It's a South Manchester institution and heart of the community. It also happens to be our local.
					</p>
					<p className="the-day-text">
						We'll be having our ceremony and hosting the reception dinner outside in the lovely pub garden (weather permitting). Later in the evening we'll take the party inside to the function room, next door to which you will find a host of pub favourites - pool, snooker and darts.
					</p>
					<img className="venue-image" src="/the_klondyke.jpg" alt="The Klondyke" />
				</div>
			</div>

			{/* Directions */}
			<div className="section-content">
				<img className="section-icon" src={directionsIcon} />
				<div className="the-day-text-section">
					<h4><strong>Directions</strong></h4>
					<p className="the-day-text">
						You can find the venue easily on Google Maps or via the map widget below.
					</p>
					<p className="the-day-text">
						There will be no parking within the venue and limited street parking nearby, therefore we recommend arriving via bus, train or taxi.
					</p>
					<p className="the-day-text">
						If you must drive, there is a car park near Levenshulme train station which is around 5 minutes walk from the venue. It can be accessed via Farm Side Place, Levenshulme, Manchester M19 3BF.
					</p>
					<h4><strong>Bus</strong></h4>
					<p className="the-day-text">The bus routes that pass closest to the venue and have regular services are:</p>
					<ul>
						<li>The 192 between Manchester City Centre and Stockport - these run via Stockport Road and carry on well into the night.</li>
						<li>The 197 is less frequent between Manchester and Stockport but there's a stop slightly closer to the venue and it runs through the Heatons if you are staying in South Manchester.</li>
						<li>The 150 runs between Gorton and Trafford - this is roughly every 30 minutes.</li>
						<li>The 50 runs between Manchester City Centre and East Didsbury but the stop is slightly further from the venue - around 10 minutes walk.</li>
					</ul>
					<h4><strong>Train</strong></h4>
					<p className="the-day-text">
						There is a train between Manchester City Centre and Levenshulme which takes less than 10 minutes and tends to be every 30 minutes or so.
					</p>
					<p className="the-day-text">
						Similarly there is a train between Stockport and Levenshulme which takes under 10 minutes every 30 minutes or so.
					</p>
					<p className="the-day-text">
						There are also local services catering to less frequently used stations but these tend to run slower and less frequently/reliably.
					</p>
					<h4><strong>Taxi</strong></h4>
					<p className="the-day-text">
						Ubers are quick to find throughout most of Manchester but especially Levenshulme so you are unlikely to need to pre-book any taxis. The vast majority of Manchester is less than a 30 minute taxi ride away.
					</p>
				</div>
			</div>

			{/* Map */}
			<div className="google-content">
				<div className="google-title-content">
					<img className="google-icon" src={mapIcon} />
					<h4 className="google-title"><strong>Location</strong></h4>
				</div>
				<Wrapper apiKey={googleApiKey} render={renderGoogleMap}>
					<MapComponent>
						<Marker options={{
							position: klondykePosition,
							icon: { url: venueIcon, scaledSize: { height: 32, width: 32 } }
						}} infoWindowContent={createStyledInfoWindowContent(klondykeInfoContent)} />
						<Marker options={{
							position: levenshulmeStationPosition,
							icon: { url: directionsIcon, scaledSize: { height: 32, width: 32 } }
						}} infoWindowContent={createStyledInfoWindowContent(levenshulmeStationInfoContent)} />
					</MapComponent>
				</Wrapper>
			</div>

			{/* Places to Stay */}
			<div className="section-content">
				<img className="section-icon" src={accommodationIcon} />
				<div className="the-day-text-section">
					<h4><strong>Places to Stay</strong></h4>
					<p className="the-day-text">With all this in mind, places we would recommend to stay are:</p>
					<ul>
						<li><strong>Manchester City Centre</strong> - Strong transport links, lots to do and see, plenty of choices of accommodation.</li>
						<li><strong>Stockport</strong> - Quieter than Manchester, good transport links, named as one of Time Out's best places to visit in 2026.</li>
						<li><strong>Chorlton or Didsbury</strong> - Leafy suburbs of South Manchester, family atmosphere, vibrant food scenes.</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default TheDay;
