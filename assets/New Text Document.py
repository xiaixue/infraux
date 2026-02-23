import json
import numpy as np
from shapely.geometry import Point, Polygon

# Load polygon
with open("locations.json", "r") as f:
    data = json.load(f)

polygon_coords = data["cu_pol"]
polygon = Polygon(polygon_coords)

# Load XYZ
xyz = np.loadtxt("elevation.xyz", delimiter=",")

x = xyz[:, 0]
y = xyz[:, 1]
z = xyz[:, 2]



mask = np.array([
    polygon.contains(Point(xi, yi))
    for xi, yi in zip(x, y)
])

xyz_clipped = xyz[mask]


np.savetxt(
    "cu_elev_grid_clipped.xyz",
    xyz_clipped,
    delimiter=",",
    fmt="%.3f"
)

import matplotlib.pyplot as plt

plt.scatter(x, y, s=1, c="lightgray")
plt.scatter(
    xyz_clipped[:,0],
    xyz_clipped[:,1],
    s=1,
    c="red"
)

px, py = zip(*polygon_coords)
plt.plot(px, py, "k-", lw=1)

plt.axis("equal")
plt.show()
