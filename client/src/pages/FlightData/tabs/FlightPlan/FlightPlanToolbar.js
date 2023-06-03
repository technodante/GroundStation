import React, { useEffect, useState } from "react"
import { Box, Button, Dropdown, RadioList, Label } from "components/UIElements"
import { red } from "theme/Colors"
import { httppost } from "backend"

import { Row, Column, Modal, ModalHeader, ModalBody } from "components/Containers"
import Commands from "commands"

const FlightPlanToolbar = props => {
	const [open, setOpen] = useState(false)
	const [missing, setMissing] = useState([])

	const savePath = (path) => {
		for (const [i, marker] of path.entries()) {
			if (marker.opacity) {
				path = [...path.slice(0, i), { ...marker, opacity: 1 }, ...path.slice(i + 1)]
			}
		}
		props.setters.path(path)

		props.setters.pathSave(path)
		props.setters.pathSaved(true)

		httppost("/uav/commands/generate", {"waypoints": path.map(waypoint => ({
				...waypoint,
				lat: waypoint.lat ?? 0.0,  // if jump
				lon: waypoint.lng ?? 0.0,  // if jump
				alt: (waypoint.alt ?? 0.0) / 3.281,  // altitude to m
				p3: (waypoint.p3 ?? 0.0) / 3.281,  // loiter radius to m
		})) })
	}

	return (
		<div style={{ marginLeft: 10 }}>
			<Modal open={open} setOpen={setOpen}>
				<ModalHeader>Missing Altitudes</ModalHeader>
				<ModalBody>Some path points don't have a set altitude. Set all the altitudes to save the points to the backend. You're missing altitude{missing.length > 1 ? "s" : ""} on point{missing.length > 1 ? "s" : ""}: <br /> <br /> {missing.map(i => i + 1).join(", ")} <br />
				<br /><Button style={{ "width": "15em" }} onClick={() => {
					let path = props.getters.path.slice()
					for (let i of missing) {
						path[i].alt = props.getters.defaultAlt
					}

					setOpen(false)
					savePath(path)
				}}>Set as default ({props.getters.defaultAlt} ft)</Button></ModalBody>
			</Modal>


			<Column style={{ marginBottom: "1rem", gap: "1.5rem" }}>
				<Row>
					<Row>
						<div style={{ "display": "flex", "alignItems": "center" }}>
							<span>Mode: </span>
						</div>
						<Dropdown initial={"Disabled"} onChange={(v) => {
							props.setters.placementMode(v)
						}}>
							<span value="disabled">Disabled</span>
							<span value="push">Push</span>
							<span value="insert">Insert</span>
						</Dropdown>
					</Row>
					&nbsp;
				</Row>
				<Row>
					<Row>
						<div style={{ "display": "flex", "alignItems": "center" }}>
							<span>Place: </span>
						</div>
						<Dropdown initial={"Waypoint"} onChange={(v) => {
							props.setters.mode(v)
						}}>
							<span value="waypoint">Waypoint</span>
							<span value="jump">Jump</span>
							<span value="unlimLoiter">Unlimited Loiter</span>
							<span value="turnLoiter">Turn Loiter</span>
							<span value="timeLoiter">Time Loiter</span>
						</Dropdown>
					</Row>
					&nbsp;
				</Row>
				<Row>
					<Row>
						<div style={{ "display": "flex", "alignItems": "center" }}>
							<span>Default Altitude:</span>
						</div>
						<Box editable={true} content={props.getters.defaultAlt + " ft"} onChange={(v) => {
							if (!Number.isNaN(Number(v)) && v.length > 0) {
								if (v.endsWith(".")) {
									props.setters.defaultAlt(125)
								} else {
									props.setters.defaultAlt(Number(v))
								}
								return v
							} else if (v.substring(0, v.length - 1).endsWith(".")) {
								return v.substring(0, v.length - 1)
							} else if (v.length === 0) {
								props.setters.defaultAlt(125)
								return v
							} else if (v.substring(0, Math.max(v.length - 1, 1)) === "-") {
								props.setters.defaultAlt(125)
								return v.substring(0, Math.max(v.length - 1, 1))
							} else if (Number.isNaN(parseFloat(v))) {
								return ""
							}

							return props.getters.defaultAlt
						}} />
					</Row>
					&nbsp;
				</Row>
				<br />
				{props.getters.pathSaved ? <br /> :
					<span style={{ color: red }}>You have unsaved points!</span>
				}
				<Row height="2.75rem">
					<Button disabled={props.getters.pathSaved} onClick={() => {
						let miss = []
						for (const [i, value] of props.getters.path.entries()) {
							if (!value.alt && value.cmd !== Commands.jump) {
								miss.push(i)
							}
						}
						if (miss.length > 0) {
							setMissing(miss)
							setOpen(true)
							return
						}

						savePath(props.getters.path)
					}}>Save Path to Mission File</Button>
					<Button disabled={props.getters.pathSaved} onClick={() => {
						console.log(props.getters.pathSave)
						props.setters.path(structuredClone(props.getters.pathSave))
						props.setters.pathSaved(true)
					}}>Reset to Mission File</Button>
				</Row>
				<Row height="2.75rem">
					<Button href="http://localhost:5000/uav/commands/view" newTab={true} title="Open the plane Pixhawk mission file in a new tab.">View Mission File</Button>
					<Button onClick={() => httppost("/uav/commands/clear")} title="Clear the mission file in the backend, but not the plane.">Clear Mission File</Button>
				</Row>
				<Row height="2.75rem">
					<Button style={{ width: "auto" }} disabled={props.getters.path.length === 0} onClick={() => {
						props.setters.path([])
						props.setters.pathSaved(false)
					}}>Clear All</Button>
					&nbsp;
					&nbsp;
				</Row>
			</Column>
		</div>
	)
}

export default FlightPlanToolbar
