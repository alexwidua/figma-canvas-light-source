export const clamp = (num, min, max) => Math.min(Math.max(num, min), max)
export const normalize = (val, max, min) => {
	return (val - min) / (max - min)
}
