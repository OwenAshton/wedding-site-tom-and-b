import {FC, useState, useEffect} from 'react';
import ScheduleItem from './ScheduleItem';
import './Schedule.css';
const transportPickUp = '/icons/scheduleIcons/007-bus.png';
const churchIcon = '/icons/scheduleIcons/002-church.png'
const ceremonyIcon = '/icons/scheduleIcons/004-diamond.png'
const cocktailsIcon = '/icons/scheduleIcons/001-martini.png'
const weddingBreakfastIcon = '/icons/scheduleIcons/005-wedding-dinner.png'
const partyIcon = '/icons/scheduleIcons/006-disco-ball.png'
const carriagesIcon = '/icons/scheduleIcons/003-wedding-car.png'

const Schedule = () : FC<{}> =>{
    const [isMobile, setMobileView] = useState(true);

    const handleIsMobile = () => {
        if (window.innerWidth < 500) {
            setMobileView(true);
        } else {
            setMobileView(false)
        }
    }

    useEffect(() => {
        handleIsMobile();
      window.addEventListener("resize", handleIsMobile);

      return () => {
        window.removeEventListener("resize", handleIsMobile);
      };
    }, []);

    return (
        <div className={isMobile?"schedule-container-mobile":"schedule-container"}>
            <ScheduleItem
                iconUrl={transportPickUp}
					text={"Book your own taxis"}
                    time={"1:00pm"}
					index={1}
					isLast={false}/>
            <ScheduleItem
                iconUrl={churchIcon}
					text={"Guest Arrival"}
                    time={"1:30pm"}
					index={2}
					isLast={false}/>
            <ScheduleItem
                iconUrl={ceremonyIcon}
					text={"Ceremony"}
                    time={"2:00pm"}
					index={3}
					isLast={false}/>
            <ScheduleItem
                iconUrl={cocktailsIcon}
					text={"Cocktail Reception"}
                    time={"3:30pm"}
					index={4}
					isLast={false}/>
            <ScheduleItem
                iconUrl={weddingBreakfastIcon}
					text={"Wedding Breakfast"}
                    time={"5:30pm"}
					index={5}
					isLast={false}/>
            <ScheduleItem
                iconUrl={partyIcon}
					text={"Party Time!"}
                    time={"8:00pm"}
					index={6}
					isLast={false}/>
            <ScheduleItem
                iconUrl={carriagesIcon}
                text={"Carriages"}
                time={"12:00am"}
                index={7}
                isLast={true}/>
        </div>
        )
}

export default Schedule;