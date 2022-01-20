import { once, showUI } from '@create-figma-plugin/utilities'
import { radToDeg } from './utils/math'

export default function () {
	// Create ref for node
	let selectionRef = undefined

	// Create sun
	const sun = figma.createEllipse()
	sun.fills = [
		{
			type: 'SOLID',
			color: { r: 1, g: 0.5, b: 0 }
		}
	]
	sun.setPluginData('is-sun', 'TRUE')

	const updateShadows = (node) => {
		if (!node) return

		const nodePos = { x: node.x, y: node.y }

		// 'Global sun'
		const sunPos = { x: sun.x, y: sun.y }

		// Get angle from sun to element
		const angleRad = Math.atan2(nodePos.y - sunPos.y, nodePos.x - sunPos.x)
		const angleDeg = radToDeg(angleRad)

		// Get distance from sun to node
		const distance = {
			x: Math.abs(
				sunPos.x + sun.width / 2 - (nodePos.x + node.width / 2)
			),
			y: Math.abs(
				sunPos.y + sun.height / 2 - (nodePos.y + node.height / 2)
			)
		}

		const shadow: DropShadowEffect = {
			type: 'DROP_SHADOW',
			color: { r: 0, g: 0, b: 0, a: 1 },
			offset: {
				x: Math.cos(angleRad) * distance.x,
				y: Math.sin(angleRad) * distance.y
			},
			radius: 24,
			spread: 24,
			visible: true,
			blendMode: 'NORMAL'
		}

		node.effects = [shadow]
	}

	const handleSelectionChange = () => {
		const node = figma.currentPage.selection[0]
		if (node && !node?.getPluginData('is-sun')) {
			selectionRef = node
			console.log('Created ref')
		}

		if (!selectionRef) return
		updateShadows(selectionRef)
	}

	const cleanUp = () => {
		sun.remove()
	}

	once('CLOSE', function () {
		figma.closePlugin()
	})

	figma.on('close', cleanUp)
	figma.on('selectionchange', handleSelectionChange)

	showUI({
		width: 240,
		height: 137
	})
}
