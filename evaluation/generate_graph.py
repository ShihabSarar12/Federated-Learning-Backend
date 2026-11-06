import json
import matplotlib.pyplot as plt

plt.rcParams.update({
    "figure.figsize": (10, 6),
    "axes.titlesize": 16,
    "axes.labelsize": 13,
    "xtick.labelsize": 11,
    "ytick.labelsize": 11,
    "font.weight": "medium"
})

with open("load_curve.json", "r") as f:
    data = json.load(f)

loads = []
latency = []
rps = []
errors = []

fail_x = []

for d in data:
    loads.append(d["load"])
    latency.append(d["avgLatency"])
    rps.append(d["requestsPerSec"])
    errors.append(d["errorRate"])

    if d["avgLatency"] == 0 and d["requestsPerSec"] == 0:
        fail_x.append(d["load"])

plt.figure()

plt.plot(
    loads,
    latency,
    marker='o',
    linewidth=2.5,
    color='#FF3B30'
)

plt.scatter(
    fail_x,
    [0]*len(fail_x),
    marker='x',
    s=120,
    color='red',
    linewidths=2
)

plt.title("Latency Scaling Under Increasing Load", fontweight="bold")
plt.xlabel("Concurrent Connections")
plt.ylabel("Latency (ms)")
plt.grid(True, linestyle='--', alpha=0.4)

plt.savefig("latency_graph.png", dpi=300, bbox_inches='tight')
plt.close()

plt.figure()

plt.plot(
    loads,
    rps,
    marker='o',
    linewidth=2.5,
    color='#34C759'
)

plt.scatter(
    fail_x,
    [0]*len(fail_x),
    marker='x',  # type: ignore
    s=120,
    color='red',
    linewidths=2
)

plt.title("Throughput (Requests/sec) vs Load", fontweight="bold")
plt.xlabel("Concurrent Connections")
plt.ylabel("Requests/sec")
plt.grid(True, linestyle='--', alpha=0.4)

plt.savefig("rps_graph.png", dpi=300, bbox_inches='tight')
plt.close()

plt.figure()

plt.plot(
    loads,
    errors,
    marker='o',
    linewidth=2.5,
    color='#AF52DE'
)

plt.scatter(
    fail_x,
    [0]*len(fail_x),
    marker='x', # type: ignore
    s=120,
    color='red',
    linewidths=2
)

plt.title("Error Rate Under System Load Stress", fontweight="bold")
plt.xlabel("Concurrent Connections")
plt.ylabel("Error Rate")
plt.grid(True, linestyle='--', alpha=0.4)

plt.savefig("error_graph.png", dpi=300, bbox_inches='tight')
plt.close()
