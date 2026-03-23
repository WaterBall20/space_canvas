export function startRenderLoop(render: (time: number) => void) {
    function loop(time: number) {
        render(time);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}
