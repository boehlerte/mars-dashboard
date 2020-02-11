let store = {
    user: { name: 'Student' },
    apod: '',
    roverNames: ['Curiosity', 'Opportunity', 'Spirit'],
    rovers: {},
    selectedRover: 'Curiosity',
    photos: {},
}

// add our markup to the page
const root = document.getElementById('root')

const onSelectTab = (selectedTab) => {
    console.log('selected: ', selectedTab);
    updateStore(store, { selectedRover: selectedTab })
}

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    console.log('new store: ', store);
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}

// create content
const App = (state) => {
    let { rovers, roverNames, selectedRover } = state

    return `
        <header>
            <h1>Explore the Mars Rovers</h1>
        </header>
        <main>
            <section>
                ${Tabs(roverNames, selectedRover)}
                ${RoverData(rovers, selectedRover)}
            </section>
        </main>
        <footer>
            <h6>
                This page was made possible by the <a href="https://api.nasa.gov/">NASA API</a>.
            </h6>
        </footer>
    `
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store)
})

// ------------------------------------------------------  COMPONENTS
// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)
    console.log(photodate.getDate(), today.getDate());

    console.log(photodate.getDate() === today.getDate());
    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store)
    }

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

const Tabs = (roverNames, selectedRover) => {
    return (
        `
            <nav class="nav-container">
                ${roverNames.map((name) => {
                    return `
                        <a href="#" id="${name}" onclick="onSelectTab(id)">${name}</a>
                    `
                }).join('')}
            </nav>
        `
    )
}

const RoverPhotos = (rover_name, max_date) => {
    const { photos } = store
    const rover = Object.keys(photos).find(key => key === rover_name)

    if (!rover || photos[rover][0].earth_date !== max_date) {
        getLatestRoverPhotos(rover_name, max_date)
    }

    const roverPhotos = store.photos[rover_name]

    if (roverPhotos) {
        return `
            <p>Most recent photos from ${rover_name} were taken on ${max_date}</p>
            ${roverPhotos.map(photo => (
                `<img src=${photo.img_src} width=300px/>` 
            )).join('')}
        `
    }
    return `<div> Loading Photos... </div>`
}

const RoverData = (rovers, selectedRover) => {
    const rover = Object.keys(rovers).find(key => key === selectedRover)

    if (!rover) {
        console.log(rover)
        getRoverData(selectedRover)
    }

    const roverToDisplay = rovers[selectedRover];

    if (roverToDisplay) {
        return (
            `
                <p>${roverToDisplay.name} was launched on ${roverToDisplay.launch_date}</p>
                <p>${roverToDisplay.name} landed on Mars on ${roverToDisplay.landing_date}</p>
                <p>${roverToDisplay.status}</p>
                ${RoverPhotos(roverToDisplay.name, roverToDisplay.max_date)}
            `
        )
    } 
    return `<div> Loading Data... </div>`
}

// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))
}

const getRoverData = (rover_name) => {
    fetch(`http://localhost:3000/rovers/${rover_name}`)
        .then(res => res.json())
        .then(({ photo_manifest }) => updateStore(store, 
            {
                rovers:  {
                    ...store.rovers,
                    [rover_name]: {
                        ...store.rovers[rover_name],
                        ...photo_manifest
                    }
                }

            },
        ))
}

getLatestRoverPhotos = (rover_name, max_date) => {
    fetch(`http://localhost:3000/rover_photos/${rover_name}/${max_date}`)
        .then(res => res.json())
        .then(({ photos }) => {
            updateStore(store, {
                photos: {
                    ...store.photos,
                    [rover_name]: [...photos],
                }
            }
        )})
}
