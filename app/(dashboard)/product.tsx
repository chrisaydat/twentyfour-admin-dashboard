import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Product as ProductType } from '@/lib/types';
import { deleteProduct } from './actions';

type ProductWithDetails = ProductType & {
  stock: number;
  availableAt: Date;
  status: 'active' | 'inactive' | 'archived';
};

type ProductProps = {
  product: ProductType
}

export function Product({ product }: ProductProps) {
  return (
    <TableRow>
      <TableCell className="hidden sm:table-cell">
        <Image
          alt="Product image"
          className="aspect-square rounded-md object-cover"
          height={64}
          src={product.image_url}
          width={64}
        />
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {product.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{`₵${product.price}`}</TableCell>
      <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
      <TableCell className="hidden md:table-cell">
        {new Date(product.availableAt).toLocaleDateString("en-US")}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Open menu" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={product.id} />
                <button className="w-full text-left" type="submit">Delete</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
