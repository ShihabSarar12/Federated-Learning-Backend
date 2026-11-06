import autocannon from 'autocannon';
import fs from 'fs';

const loads = [10, 20, 30, 40, 50, 60, 70];

type ResultPoint = {
    load: number;
    avgLatency: number;
    requestsPerSec: number;
    errorRate: number;
};

const results: ResultPoint[] = [];

function runLoad(connections: number): Promise<any> {
    return new Promise((resolve, reject) => {
        const instance = autocannon(
            {
                url: 'http://localhost:3000/api/v1/blockchain/download',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: '0xA5C30C7FCe60e4080c59D322A619AB71D75e1B20',
                    start: 0,
                    limit: 10,
                }),
                connections,
                duration: 30,
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            },
        );

        autocannon.track(instance);
    });
}

async function run() {
    console.log('Starting step-load benchmark...\n');

    for (const load of loads) {
        console.log(`Running load: ${load} connections`);

        const result: any = await runLoad(load);

        const avgLatency = result.latency?.average ?? result.latency?.mean ?? 0;

        const totalRequests =
            result.requests?.total ?? result.requests?.sent ?? 0;

        const duration = result.duration ?? 30;

        const rps = totalRequests > 0 ? totalRequests / duration : 0;

        const errors =
            (result.errors ?? 0) +
            (result.timeouts ?? 0) +
            (result.non2xx ?? 0);

        const errorRate = totalRequests > 0 ? errors / totalRequests : 0;

        if (!avgLatency) {
            console.warn(`⚠️ No latency data at load ${load}`);
        }

        results.push({
            load,
            avgLatency,
            requestsPerSec: rps,
            errorRate,
        });

        console.log(
            `✔ load=${load} | latency=${avgLatency.toFixed(2)}ms | rps=${rps.toFixed(
                2,
            )} | errorRate=${(errorRate * 100).toFixed(2)}%`,
        );
    }

    fs.writeFileSync('load_curve.json', JSON.stringify(results, null, 2));

    console.log('\nSaved: load_curve.json');
}

run().catch(console.error);
