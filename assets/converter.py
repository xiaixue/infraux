import numpy as np
import matplotlib.pyplot as plt

data = np.loadtxt("cu_elev_grid_clipped.xyz", delimiter=",")

x = data[:, 0]
y = data[:, 1]
z = data[:, 2]

x_unique = np.unique(x)
y_unique = np.unique(y)

# Create empty grid
Z = np.full((len(y_unique), len(x_unique)), np.nan)

# Fill grid
x_index = {v: i for i, v in enumerate(x_unique)}
y_index = {v: i for i, v in enumerate(y_unique)}

for xi, yi, zi in zip(x, y, z):
    Z[y_index[yi], x_index[xi]] = zi

# Optional quick check
plt.imshow(Z, origin="lower")
plt.colorbar(label="Elevation (m)")


Z_masked = np.ma.masked_invalid(Z)

Z_out = np.flipud(Z_masked)  # or Z_masked if you used masking

# ===================== LEGEND (COLOR SCALE) =====================

vmin = np.nanmin(Z_masked)
vmax = np.nanmax(Z_masked)

fig, ax = plt.subplots(figsize=(2, 4))

norm = plt.Normalize(vmin=vmin, vmax=vmax)
cbar = plt.colorbar(
    plt.cm.ScalarMappable(norm=norm, cmap="terrain"),
    cax=ax,
    orientation="vertical"
)

cbar.set_label("Elevation (m)")
cbar.ax.tick_params(labelsize=8)

plt.tight_layout()
plt.savefig(
    "legend_topografia.png",
    dpi=200,
    bbox_inches="tight",
    transparent=False
)
plt.close(fig)
