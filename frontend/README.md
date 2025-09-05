# TruePATH Frontend

A responsive React frontend for the TruePATH blockchain supply chain management system.

## Features

### Responsive Design
- **Mobile-first approach** with responsive breakpoints
- **Collapsible sidebar** with mobile trigger for small screens
- **Responsive grid layouts** that adapt to different screen sizes
- **Touch-friendly interfaces** optimized for mobile devices

### Product Management
- **Manufacturer Role**: Create new products with custom supply chain stages
- **Multi-Role Support**: SHIPPER, DISTRIBUTOR, RETAILER, CUSTOMER roles
- **Stage Advancement**: Verify and advance products through supply chain stages
- **Ownership Transfer**: Transfer product ownership during stage transitions

### Smart Contract Integration
- **Sui Blockchain**: Built on Sui Move smart contracts
- **Role-Based Access Control**: Secure permission system
- **Hash Chain Verification**: Cryptographic verification of supply chain progress

## Responsive Breakpoints

- **Mobile**: `sm:` (640px+) - Single column layouts, compact spacing
- **Tablet**: `md:` (768px+) - Two column layouts, medium spacing  
- **Desktop**: `lg:` (1024px+) - Full sidebar, three column layouts
- **Large Desktop**: `xl:` (1280px+) - Optimized for large screens

## Components

### CreateProductModal
- **Manufacturers only** can create products
- **Configurable stages** with custom names and roles
- **Hash input** for initial verification value
- **Responsive form** with mobile-optimized inputs

### AdvanceProductModal  
- **Role-based access** for stage advancement
- **Preimage verification** for hash chain progression
- **Optional ownership transfer** during advancement
- **Location tagging** for audit trails

### ShipmentsPage
- **Table and card views** with responsive layouts
- **Search and filtering** with mobile-friendly controls
- **Progress tracking** with visual indicators
- **Action buttons** sized for touch interfaces

## Usage

### For Manufacturers
1. Connect wallet with manufacturer role
2. Click "Create Product" button
3. Fill in product details and supply chain stages
4. Submit transaction to create product on blockchain

### For Other Roles
1. Connect wallet with appropriate role (SHIPPER, DISTRIBUTOR, etc.)
2. View products in Shipments page
3. Click "Advance Stage" on products you can process
4. Provide preimage and optional new owner
5. Submit transaction to advance product stage

## Technical Details

- **React 18** with TypeScript
- **Tailwind CSS** for responsive styling
- **Sui DApp Kit** for blockchain integration
- **React Query** for data management
- **Lucide React** for consistent icons

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Smart Contract Integration

The frontend integrates with the TruePATH Move smart contracts:
- `truepath::truepath` - Product management and verification
- `truepath::roles` - Role-based access control
- Participant registry for user management
- Hash chain verification for supply chain integrity


<!-- https://app.example.com/product/<object_id>?sku=<sku>&batch=<batch_id> -->