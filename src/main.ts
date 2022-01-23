import {
	once,
	emit,
	showUI,
	getAbsolutePosition
} from '@create-figma-plugin/utilities'
import { easeCubic, easeQuadOut, easeExpIn } from 'd3-ease'
import chroma from 'chroma-js'
import { clamp, normalize } from './utils/math'
import { searchForIntersectingNode } from './utils/node'

const NUM_SHADOW_LAYERS = 8
const TARGET_ELEMENT_ELEVATION = 0.5

export default function () {
	// Skip over invisible nodes and their descendants inside instances for faster performance
	figma.skipInvisibleInstanceChildren = true

	/**
	 * Create node ref. This will be the node that casts the shadow.
	 */
	let selectionRef = undefined

	/**
	 * Create light source ("sun")
	 */
	const sun = figma.createEllipse()
	sun.fills = [
		{
			type: 'SOLID',
			color: { r: 1, g: 1, b: 1 }
		}
	]
	sun.setPluginData('is-sun', 'TRUE')

	/**
	 * Update node casted shadow
	 */
	const updateShadows = (node) => {
		if (!node) return

		let useTintedShadow
		const hasBackdrop = searchForIntersectingNode(figma.currentPage, node)

		if (hasBackdrop) {
			const fill = hasBackdrop.fills[hasBackdrop.fills.length - 1]

			if (fill) {
				let hsl = chroma
					.gl(fill.color.r, fill.color.g, fill.color.b)
					.hsl()
				// check if color has hue (ex. no white, grey, black)
				if (!isNaN(hsl[0])) {
					hsl[2] = 0.2 // decrease lightness
					useTintedShadow = chroma.hsl(hsl[0], hsl[1], hsl[2]).gl()
				}
			}
		}

		// Positions
		// Get absolute position to avoid wrong angle when target node is within frame
		const nodeAbs = getAbsolutePosition(node)
		const sunAbs = getAbsolutePosition(sun)

		const nodePos = {
			x: nodeAbs.x + node.width / 2,
			y: nodeAbs.y + node.height / 2
		}
		const sunPos = {
			x: sunAbs.x + sun.width / 2,
			y: sunAbs.y + sun.height / 2
		}

		// Angle between light source ⟷ node
		const angleBetweenLightAndNode = Math.atan2(
			nodePos.y - sunPos.y,
			nodePos.x - sunPos.x
		)

		// Distance between light source ⟷ node
		const p1 = sunPos.x - nodePos.x
		const p2 = sunPos.y - nodePos.y
		const distance = Math.sqrt(p1 * p1 + p2 * p2)

		// Blur shadow the further away the light source is
		const blurShadowWithDistance = clamp(distance / 100, 0.8, 5)

		// Calculate relative scale between sun ⟷ node
		// We do this to blur the shadow if the light source is relatively massive
		const lightSurface = (sun.width / 2) * (sun.width / 2) * Math.PI
		const nodeSurface = node.height * node.width
		const relativeScaleBetweenLightAndNode = clamp(
			(lightSurface * 100) / nodeSurface / 100,
			0.8,
			100
		)

		// Create shadows
		const shadows = Array.from({ length: NUM_SHADOW_LAYERS }, (_, i) => {
			const normalizedStep = easeQuadOut(
				normalize(i, NUM_SHADOW_LAYERS, 0)
			)

			const shadow: DropShadowEffect = {
				type: 'DROP_SHADOW',
				color: useTintedShadow
					? {
							r: useTintedShadow[0],
							g: useTintedShadow[1],
							b: useTintedShadow[2],
							a: 0.5 - 0.5 * normalizedStep
					  }
					: { r: 0, g: 0, b: 0, a: 0.5 - 0.5 * normalizedStep },
				offset: {
					x:
						Math.cos(angleBetweenLightAndNode) *
						(distance * normalizedStep * TARGET_ELEMENT_ELEVATION),
					y:
						Math.sin(angleBetweenLightAndNode) *
						(distance * normalizedStep * TARGET_ELEMENT_ELEVATION)
				},
				radius:
					100 *
					relativeScaleBetweenLightAndNode *
					blurShadowWithDistance *
					normalizedStep,
				spread: 0,
				visible: true,
				blendMode: 'NORMAL'
			}
			return shadow
		})

		node.effects = shadows

		// Get an average shadow value to display in the UI windows
		// For demo purposes only
		const sumOfAllShadowValues = shadows.reduce(
			(prev, curr) => {
				return {
					x: prev.x + curr.offset.x,
					y: prev.y + curr.offset.y,
					blur: prev.blur + curr.radius,
					spread: prev.spread + curr.spread,
					r: prev.r + curr.color.r,
					g: prev.g + curr.color.g,
					b: prev.b + curr.color.b,
					opacity: prev.opacity + curr.color.a
				}
			},
			{
				x: 0,
				y: 0,
				blur: 0,
				spread: 0,
				r: 0,
				g: 0,
				b: 0,
				opacity: 1
			}
		)
		// Divide sum by num of layers to get average
		Object.keys(sumOfAllShadowValues).forEach(
			(el) =>
				(sumOfAllShadowValues[el] =
					sumOfAllShadowValues[el] / NUM_SHADOW_LAYERS)
		)
		emit('VALUE_UPDATE', sumOfAllShadowValues)
	}

	/**
	 * Handle selection change
	 */
	const handleSelectionChange = () => {
		const node = figma.currentPage.selection[0]
		if (node && !node?.getPluginData('is-sun')) {
			selectionRef = node
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
