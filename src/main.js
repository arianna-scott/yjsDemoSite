import './style.css'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
const container = document.getElementById('components')

// change to your project id
const projectId = "5066549580791808"
const doc = new Y.Doc()

const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  projectId,
  doc
)

const awareness = wsProvider.awareness

// can make user who ever you want
awareness.setLocalStateField('user', {
  name: 'Arianna',
  color: '#59de4aff',
  activeComponent: null
})

const allComponentsMap = doc.getMap('components')
const usersEl = document.getElementById('users')

// console.log("initial", doc.getMap('components').toJSON())
// console.log(wsProvider.roomname)
wsProvider.on("status", e => {
  console.log("provider status:", e.status)
})


allComponentsMap.observeDeep(events => {
      console.log('change detected!')
      // console.log("all events", events)
      
      events.forEach(event => {
        event.changes.keys.forEach((change, key) => {
          const uuid = event.path?.[0]
          const componentMap = allComponentsMap.get(uuid)

          const name = componentMap?.get("$Name") || uuid
          console.log("Name:", name) //component uuid
          console.log("Key:", key) //property
          console.log("Action:", change.action) 
          console.log("New Value:", event.target.get(key))
        })
      })
      render()
})

wsProvider.on('sync', isSynced => {
  console.log('synced:', isSynced)
  // console.log('awareness states:', wsProvider.awareness.getStates().size) 

  if (isSynced) {
    render()
  }
   
})

// loads all the components in the project onto the screen
// handles removal (permanent) and property changes
function render() {
  container.innerHTML = ''

  const data = allComponentsMap.toJSON()

  Object.entries(data).forEach(([uuid, comp]) => {
    const wrapper = document.createElement('div')
    wrapper.style.border = "1px solid #ccc"
    wrapper.style.padding = "10px"
    wrapper.style.margin = "10px"

    const name = comp.$Name || uuid

    wrapper.innerHTML = `
      <h3>${name}</h3>
      
      <input id="prop-${uuid}" placeholder="property name" />
      <input id="val-${uuid}" placeholder="property value" />

      <button id="apply-${uuid}">Apply</button>
    `

    container.appendChild(wrapper)

    const deleteButton = document.createElement('button')
    deleteButton.textContent = "Remove"

    deleteButton.onclick = () => {
      allComponentsMap.delete(uuid)
    }

    wrapper.appendChild(deleteButton)
    wrapper.onclick = () => {
      selectComponent(uuid, name)
    }

    const propInput = wrapper.querySelector(`#prop-${uuid}`)
    const valInput = wrapper.querySelector(`#val-${uuid}`)
    const applyButton = wrapper.querySelector(`#apply-${uuid}`)

    applyButton.onclick = () => {
      const key = propInput.value
      const value = valInput.value

      if (!key) return

      const componentMap = allComponentsMap.get(uuid)
      if (!componentMap) return

      componentMap.set(key, value)

      // optional: clear inputs
      propInput.value = ''
      valInput.value = ''
    }
  })
}

function renderUsers() {
  const states = Array.from(awareness.getStates().values())

  usersEl.innerHTML = `
    <h3>Active Users</h3>
    ${states.map(s => {
      const u = s.user
      if (!u) return ''
      return `
        <div>
          <span style="color:${u.color}">●</span>
          ${u.name}
          ${u.activeComponent ? `(editing ${u.activeComponent})` : '(viewing)'}
        </div>
      `
    }).join('')}
  `
}

function selectComponent(uuid, name) {
  awareness.setLocalStateField('user', {
    ...awareness.getLocalState()?.user,
    activeComponent: name
  })
}

awareness.on('change', renderUsers)